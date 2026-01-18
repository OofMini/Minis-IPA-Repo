#!/bin/bash
# PROFESSIONAL GRADE: Strict Mode & Error Handling
set -euo pipefail
IFS=$'\n\t'

# Cleanup trap
cleanup() {
    local exit_code=$?
    rm -rf temp_strip_entitlements entitlements.xml entitlements_new.xml ldid_bin
    if [ $exit_code -ne 0 ]; then
        echo "::error::Script failed unexpectedly at line $LINENO"
    fi
    exit $exit_code
}
trap cleanup EXIT INT TERM

IPA_URL="${1:-}"
KEYS_TO_REMOVE="${2:-}"

if [[ -z "$IPA_URL" ]]; then
    echo "::error::No IPA URL provided."
    exit 1
fi

if [[ -z "$KEYS_TO_REMOVE" ]]; then
    echo "::warning::No entitlements specified. Defaulting to 'com.apple.developer.siri'."
    KEYS_TO_REMOVE="com.apple.developer.siri"
fi

# 1. Install ldid (Robust Method)
LDID_CMD="ldid"

if ! command -v ldid &> /dev/null; then
    echo "📦 Installing ldid..."
    
    # Download Static Binary (Fastest & Most Reliable on CI)
    echo "   - Attempting to download static binary..."
    curl -L -o ldid_bin "https://github.com/ProcursusTeam/ldid/releases/download/v2.1.5-procursus7/ldid_linux_x86_64"
    
    if [[ -f "ldid_bin" ]] && [[ $(stat -c%s "ldid_bin") -gt 1024 ]]; then
        chmod +x ldid_bin
        LDID_CMD="./ldid_bin"
        echo "   - Download successful."
    else
        echo "   - Binary download failed. Trying Homebrew..."
        rm -f ldid_bin
        
        if command -v brew &> /dev/null; then
            brew install ldid
            LDID_CMD="ldid"
        else
            echo "::error::Could not install ldid."
            exit 1
        fi
    fi
fi

# 2. Download IPA
FILENAME=$(basename "${IPA_URL%%\?*}")
if [[ "$FILENAME" != *.ipa ]]; then FILENAME="${FILENAME}.ipa"; fi
MODIFIED_NAME="${FILENAME%.ipa}_Stripped.ipa"

echo "⬇️ Downloading: $FILENAME"
curl -L -o "$FILENAME" "$IPA_URL"

if [[ ! -f "$FILENAME" ]]; then
    echo "::error::Download failed."
    exit 1
fi

echo "📦 Unpacking IPA..."
unzip -q "$FILENAME" -d temp_strip_entitlements

# Find the .app directory
APP_DIR=$(find temp_strip_entitlements/Payload -maxdepth 1 -name "*.app" | head -n 1)
if [[ -z "$APP_DIR" ]]; then
    echo "::error::Invalid IPA: No .app folder found."
    exit 1
fi

# 3. Find Binary Name (Robustly via Info.plist)
echo "🔍 Identifying Binary..."
if [[ -f "$APP_DIR/Info.plist" ]]; then
    BINARY_NAME=$(python3 -c "import plistlib, sys; print(plistlib.load(open('$APP_DIR/Info.plist', 'rb')).get('CFBundleExecutable', ''))" 2>/dev/null || echo "")
fi

# Fallback if python check failed or returned empty
if [[ -z "${BINARY_NAME:-}" ]]; then
    echo "::warning::Could not read CFBundleExecutable. Guessing from folder name."
    BINARY_NAME=$(basename "${APP_DIR%.*}")
fi

BINARY_PATH="$APP_DIR/$BINARY_NAME"
echo "   - Target Binary: $BINARY_NAME"

if [[ ! -f "$BINARY_PATH" ]]; then
    echo "::error::Binary not found at $BINARY_PATH"
    exit 1
fi

# 4. Process Entitlements
echo "   - Extracting current entitlements..."

# Allow ldid -e to fail (return non-zero) without crashing script using "|| true"
# This happens if the binary is unsigned.
"$LDID_CMD" -e "$BINARY_PATH" > entitlements.xml 2>/dev/null || true

if [ ! -s entitlements.xml ]; then
    echo "::warning::Binary is unsigned or has no entitlements."
    echo "✍️  Applying fresh ad-hoc signature (cleans restrictions)..."
    "$LDID_CMD" -S "$BINARY_PATH"
else
    echo "✂️  Stripping keys: $KEYS_TO_REMOVE"
    
    python3 -c "
import sys, plistlib

keys_to_remove = '$KEYS_TO_REMOVE'.split(',')
keys_to_remove = [k.strip() for k in keys_to_remove]

try:
    with open('entitlements.xml', 'rb') as f:
        content = f.read()
        try:
            pl = plistlib.loads(content)
        except:
            try:
                # If binary/xml mix fails, try loading as standard XML string
                pl = plistlib.loads(content, fmt=None)
            except:
                # Fallback: Treat as empty/unparseable and exit with code 3
                sys.exit(3)

    modified = False
    for key in keys_to_remove:
        if key in pl:
            del pl[key]
            print(f'   - Removed: {key}')
            modified = True
        else:
            print(f'   - Key not found: {key}')

    if modified:
        with open('entitlements_new.xml', 'wb') as f:
            plistlib.dump(pl, f)
    else:
        sys.exit(2) # Code 2: No changes needed

except Exception as e:
    print(f'::warning::Plist processing error: {e}')
    sys.exit(3) # Code 3: Parse error
"
    
    RET_CODE=$?
    
    if [ $RET_CODE -eq 0 ]; then
        echo "✍️  Re-signing binary with modified entitlements..."
        "$LDID_CMD" -Sentitlements_new.xml "$BINARY_PATH"
        rm entitlements_new.xml
    elif [ $RET_CODE -eq 2 ]; then
        echo "ℹ️  Entitlements clean. Skipping resign."
    else
        echo "::warning::Could not parse entitlements. Re-signing ad-hoc to be safe."
        "$LDID_CMD" -S "$BINARY_PATH"
    fi
    rm entitlements.xml
fi

# 5. Repack
echo "📦 Repacking IPA..."
cd temp_strip_entitlements
zip -qr "../$MODIFIED_NAME" Payload
cd ..

echo "✅ Done! Created: $MODIFIED_NAME"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "modified_ipa_path=$MODIFIED_NAME" >> "$GITHUB_OUTPUT"
fi
