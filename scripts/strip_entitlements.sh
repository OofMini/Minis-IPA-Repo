#!/bin/bash
# PROFESSIONAL GRADE: Strict Mode & Error Handling
set -euo pipefail
IFS=$'\n\t'

# Cleanup trap
cleanup() {
    local exit_code=$?
    rm -rf temp_strip_entitlements ldid
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

# 1. Install ldid (Link Identity Editor) for handling entitlements
if ! command -v ldid &> /dev/null; then
    echo "📦 Installing ldid..."
    # We download a known stable binary because apt version can be outdated
    curl -L -o ldid https://github.com/ProcursusTeam/ldid/releases/download/v2.1.5/ldid_linux_x86_64
    chmod +x ldid
    LDID="./ldid"
else
    LDID="ldid"
fi

# 2. Download IPA
FILENAME=$(basename "${IPA_URL%%\?*}")
if [[ "$FILENAME" != *.ipa ]]; then FILENAME="${FILENAME}.ipa"; fi
MODIFIED_NAME="${FILENAME%.ipa}_Stripped.ipa"

echo "⬇️ Downloading: $FILENAME"
curl -L -o "$FILENAME" "$IPA_URL"

echo "📦 Unpacking IPA..."
unzip -q "$FILENAME" -d temp_strip_entitlements

# Find the .app directory
APP_DIR=$(find temp_strip_entitlements/Payload -maxdepth 1 -name "*.app" | head -n 1)
BINARY_NAME=$(basename "${APP_DIR%.*}")
BINARY_PATH="$APP_DIR/$BINARY_NAME"

echo "🔍 Processing Binary: $BINARY_NAME"

# 3. Extract Entitlements
echo "   - Extracting current entitlements..."
$LDID -e "$BINARY_PATH" > entitlements.xml

if [ ! -s entitlements.xml ]; then
    echo "::warning::No entitlements found in binary. Nothing to strip."
    # Pack it back up anyway in case they just wanted a repack
else
    # 4. Modify Entitlements using Python (Safe Plist Editing)
    echo "✂️  Stripping keys: $KEYS_TO_REMOVE"
    
    python3 -c "
import sys, plistlib

keys_to_remove = '$KEYS_TO_REMOVE'.split(',')
keys_to_remove = [k.strip() for k in keys_to_remove]

try:
    with open('entitlements.xml', 'rb') as f:
        # Load plist (handles both XML and Binary formats)
        pl = plistlib.load(f)
        
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
        print('   - No matching keys found to remove.')
        sys.exit(2) # Exit code 2 = no changes

except Exception as e:
    print(f'::error::Failed to process plist: {e}')
    sys.exit(1)
"
    
    RET_CODE=$?
    
    if [ $RET_CODE -eq 0 ]; then
        # 5. Re-sign binary with new entitlements
        echo "✍️  Re-signing binary with clean entitlements..."
        $LDID -Sentitlements_new.xml "$BINARY_PATH"
        rm entitlements_new.xml
    elif [ $RET_CODE -eq 2 ]; then
        echo "ℹ️  Skipping resign (no changes needed)."
    fi
    rm entitlements.xml
fi

# 6. Repack
echo "📦 Repacking IPA..."
cd temp_strip_entitlements
zip -qr "../$MODIFIED_NAME" Payload
cd ..

echo "✅ Done! Created: $MODIFIED_NAME"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "modified_ipa_path=$MODIFIED_NAME" >> "$GITHUB_OUTPUT"
fi
