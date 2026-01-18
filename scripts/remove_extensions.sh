#!/bin/bash
# PROFESSIONAL GRADE: Strict Mode & Error Handling
set -euo pipefail
IFS=$'\n\t'

# Cleanup trap
cleanup() {
    local exit_code=$?
    rm -rf temp_extract
    if [ $exit_code -ne 0 ]; then
        echo "::error::Script failed unexpectedly at line $LINENO"
    fi
    exit $exit_code
}
trap cleanup EXIT INT TERM

IPA_URL="${1:-}"

if [[ -z "$IPA_URL" ]]; then
    echo "::error::No IPA URL provided."
    exit 1
fi

# Extract filename from URL (stripping query params)
FILENAME=$(basename "${IPA_URL%%\?*}")
# Ensure extension is .ipa
if [[ "$FILENAME" != *.ipa ]]; then FILENAME="${FILENAME}.ipa"; fi

MODIFIED_NAME="${FILENAME%.ipa}_NoExtensions.ipa"

echo "⬇️ Downloading: $FILENAME"
# Download with curl, following redirects
curl -L -o "$FILENAME" "$IPA_URL"

if [[ ! -f "$FILENAME" ]]; then
    echo "::error::Download failed."
    exit 1
fi

echo "📦 Unpacking IPA..."
unzip -q "$FILENAME" -d temp_extract

# Find the .app directory
APP_DIR=$(find temp_extract/Payload -maxdepth 1 -name "*.app" | head -n 1)

if [[ -z "$APP_DIR" ]]; then
    echo "::error::Invalid IPA: No .app folder found in Payload."
    exit 1
fi

echo "✂️ Removing Extensions from $(basename "$APP_DIR")..."

# 1. Remove PlugIns (Standard Widgets, Siri, Intents)
if [[ -d "$APP_DIR/PlugIns" ]]; then
    echo "   - Removing PlugIns directory..."
    rm -rf "$APP_DIR/PlugIns"
else
    echo "   - No PlugIns found (Good!)"
fi

# 2. Remove Watch (WatchOS Apps causing crashes)
if [[ -d "$APP_DIR/Watch" ]]; then
    echo "   - Removing Watch directory..."
    rm -rf "$APP_DIR/Watch"
fi

# 3. Remove Extensions (Some frameworks use this)
if [[ -d "$APP_DIR/Extensions" ]]; then
    echo "   - Removing Extensions directory..."
    rm -rf "$APP_DIR/Extensions"
fi

echo "📦 Repacking IPA..."
cd temp_extract
zip -qr "../$MODIFIED_NAME" Payload
cd ..

echo "✅ Done! Created: $MODIFIED_NAME"

# Output variable for GitHub Actions
if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "modified_ipa_path=$MODIFIED_NAME" >> "$GITHUB_OUTPUT"
fi
