#!/bin/bash
set -e

# Install dependencies if missing
if ! command -v jq &> /dev/null; then
    echo "📦 Installing jq..."
    sudo apt-get update -qq
    sudo apt-get install -y jq
fi

echo "🔍 Validating inputs..."

validate_version() {
  local version="$1"
  local app_name="$2"
  
  if [[ -z "$version" ]]; then
    echo "::error::$app_name version cannot be empty"
    exit 1
  fi
  
  # OPTIMIZATION: Relaxed Regex to support more version formats (e.g., v1.0, 1.0.0-beta, 1.0r)
  if [[ ! "$version" =~ ^[vV]?[0-9]+(\.[0-9]+)*([-a-zA-Z0-9]+)?$ ]]; then
    echo "::warning::$app_name version '$version' uses a non-standard format. Proceeding with caution."
  fi

  if [[ ${#version} -gt 30 ]]; then
    echo "::error::$app_name version string too long"
    exit 1
  fi
}

ANY_ENABLED=false

if [[ "$UPDATE_INSHOT" == "true" ]]; then ANY_ENABLED=true; validate_version "$INSHOT_VERSION" "InShot"; fi
if [[ "$UPDATE_APPSTOREPP" == "true" ]]; then ANY_ENABLED=true; validate_version "$APPSTOREPP_VERSION" "AppStore++"; fi
if [[ "$UPDATE_ITORRENT" == "true" ]]; then ANY_ENABLED=true; validate_version "$ITORRENT_VERSION" "iTorrent"; fi
if [[ "$UPDATE_LIVECONTAINER" == "true" ]]; then ANY_ENABLED=true; validate_version "$LIVECONTAINER_VERSION" "LiveContainer"; fi
if [[ "$UPDATE_REFACE" == "true" ]]; then ANY_ENABLED=true; validate_version "$REFACE_VERSION" "Reface"; fi

if [[ "$ANY_ENABLED" == "false" ]]; then
  echo "::notice::No apps enabled for update. Exiting."
  exit 0
fi

echo "✅ Input validation complete"

# Configure Git if running in CI
if [ -n "$GITHUB_ACTIONS" ]; then
    echo "⚙️ Configuring Git User..."
    git config --local user.email "github-actions[bot]@users.noreply.github.com"
    git config --local user.name "github-actions[bot]"
fi

# Process Updates
trap 'rm -f *.tmp *.bak' EXIT ERR

CURRENT_DATE=$(date -u +"%Y-%m-%d")
echo "current_date=$CURRENT_DATE" >> "$GITHUB_OUTPUT"

APP_KEYS=("inshot" "appstorepp" "itorrent" "livecontainer" "reface")

declare -A APP_NAMES=( ["inshot"]="InShotPro" ["appstorepp"]="Appstore++" ["itorrent"]="iTorrent" ["livecontainer"]="LiveContainer" ["reface"]="RefacePro (IOS 17+)" )
declare -A APP_BUNDLES=( ["inshot"]="com.inshot.video" ["appstorepp"]="com.apple.AppStore" ["itorrent"]="ru.nonamelabs.iTorrent" ["livecontainer"]="com.kdt.livecontainer" ["reface"]="com.neocortext.reface" )
declare -A APP_IDS=( ["inshot"]="inshot" ["appstorepp"]="appstoreplus" ["itorrent"]="itorrent" ["livecontainer"]="livecontainer" ["reface"]="refacepro" )
declare -A APP_URL_PATTERNS=(
  ["inshot"]="static:https://github.com/OofMini/Minis-Heap/releases/download/New/InShot.ipa"
  ["appstorepp"]="static:https://github.com/OofMini/Minis-Heap/releases/download/App%2B%2B/AppStore++_TrollStore_v1.0.3-2.ipa"
  ["itorrent"]="static:https://github.com/OofMini/Minis-Heap/releases/download/Torrent/iTorrent.ipa"
  ["livecontainer"]="static:https://github.com/OofMini/Minis-Heap/releases/download/Live/LiveContainer.ipa"
  ["reface"]="static:https://github.com/OofMini/Minis-Heap/releases/download/Reface/Reface.ipa"
)
declare -A APP_DESCRIPTIONS=(
  ["inshot"]="Pro video editor with premium filters, tools, and no watermark. App v%s."
  ["appstorepp"]="Appstore++ allows users to downgrade apps."
  ["itorrent"]="Lightweight torrent client for downloading and managing torrent files on-device."
  ["livecontainer"]="Runs live production containers for streaming apps and runtime isolation."
  ["reface"]="Reface Premium Unlocked."
)
declare -A APP_TOGGLES=( ["inshot"]="$UPDATE_INSHOT" ["appstorepp"]="$UPDATE_APPSTOREPP" ["itorrent"]="$UPDATE_ITORRENT" ["livecontainer"]="$UPDATE_LIVECONTAINER" ["reface"]="$UPDATE_REFACE" )
declare -A APP_VERSIONS=( ["inshot"]="$INSHOT_VERSION" ["appstorepp"]="$APPSTOREPP_VERSION" ["itorrent"]="$ITORRENT_VERSION" ["livecontainer"]="$LIVECONTAINER_VERSION" ["reface"]="$REFACE_VERSION" )

build_download_url() {
  local app_key="$1"
  local pattern="${APP_URL_PATTERNS[$app_key]}"
  if [[ "$pattern" == static:* ]]; then echo "${pattern#static:}"; else echo "$pattern"; fi
}

generate_description() {
  local app_key="$1"
  local app_version="$2"
  local template="${APP_DESCRIPTIONS[$app_key]}"
  if [[ "$template" == *%s* ]]; then printf "$template" "$app_version"; else echo "$template"; fi
}

update_app_in_file() {
  local file="$1" app_name="$2" bundle_id="$3" app_id="$4" app_version="$5" download_url="$6" description="$7"
  local temp_file="${file}.tmp"
  
  if [ ! -f "$file" ]; then return 0; fi

  # OPTIMIZATION: Check for existence before attempting jq to save cycles
  case "$file" in
    "sidestore.json")
      if jq -e --arg app "$app_name" --arg bundle "$bundle_id" '.apps[] | select(.name == $app or .bundleIdentifier == $bundle)' "$file" >/dev/null 2>&1; then
          jq --arg app "$app_name" --arg bundle "$bundle_id" --arg version "$app_version" --arg url "$download_url" --arg desc "$description" --arg date "$CURRENT_DATE" \
            '(.apps[] | select(.name == $app or .bundleIdentifier == $bundle)) |= (.versions[0].version = $version | .versions[0].downloadURL = $url | .versions[0].date = $date | .localizedDescription = $desc)' "$file" > "$temp_file"
      fi ;;
    "trollapps.json")
      if jq -e --arg app "$app_name" --arg bundle "$bundle_id" '.apps[] | select(.name == $app or .bundleIdentifier == $bundle)' "$file" >/dev/null 2>&1; then
          jq --arg app "$app_name" --arg bundle "$bundle_id" --arg version "$app_version" --arg url "$download_url" --arg desc "$description" --arg date "$CURRENT_DATE" \
            '(.apps[] | select(.name == $app or .bundleIdentifier == $bundle)) |= (.version = $version | .downloadURL = $url | .localizedDescription = $desc | .versionDate = $date)' "$file" > "$temp_file"
      fi ;;
    "apps.json")
      if jq -e --arg id "$app_id" '.[] | select(.id == $id)' "$file" >/dev/null 2>&1; then
          jq --arg id "$app_id" --arg version "$app_version" --arg url "$download_url" --arg desc "$description" --arg date "$CURRENT_DATE" \
            '(.[] | select(.id == $id)) |= (.version = $version | .downloadUrl = $url | .description = $desc | .date = $date)' "$file" > "$temp_file"
      fi ;;
  esac
  
  if [ -f "$temp_file" ]; then
      if ! jq empty "$temp_file" 2>/dev/null; then 
          echo "::error::Generated invalid JSON for $file"; rm -f "$temp_file"; return 1; 
      fi
      if ! cmp -s "$file" "$temp_file"; then 
          mv "$temp_file" "$file"; echo "✅ Updated $app_name in $file"; 
      else 
          rm -f "$temp_file"; 
      fi
  fi
}

update_workflow_defaults() {
  local app_key="$1" app_version="$2" workflow_file=".github/workflows/app-version-updates.yml"
  if [ ! -f "$workflow_file" ]; then return 0; fi
  escaped_version=$(printf '%s\n' "$app_version" | sed 's/[[\.*^$/]/\\&/g')
  sed -i -e "/${app_key}_version:/,/default:/ s/\(default: \)\"[^\"]*\"/\1\"$escaped_version\"/" "$workflow_file"
}

JSON_FILES=("sidestore.json" "trollapps.json" "apps.json")
UPDATED_APPS=(); UPDATED_VERSIONS=(); SKIPPED_APPS=()

for app_key in "${APP_KEYS[@]}"; do
  toggle_value="${APP_TOGGLES[$app_key]}"
  if [[ "$toggle_value" != "true" ]]; then SKIPPED_APPS+=("${APP_NAMES[$app_key]}"); continue; fi
  
  APP_VERSION="${APP_VERSIONS[$app_key]}"
  APP_NAME="${APP_NAMES[$app_key]}"
  BUNDLE_ID="${APP_BUNDLES[$app_key]}"
  APP_ID="${APP_IDS[$app_key]}"
  DOWNLOAD_URL=$(build_download_url "$app_key")
  DESCRIPTION=$(generate_description "$app_key" "$APP_VERSION")
  
  for json_file in "${JSON_FILES[@]}"; do 
      update_app_in_file "$json_file" "$APP_NAME" "$BUNDLE_ID" "$APP_ID" "$APP_VERSION" "$DOWNLOAD_URL" "$DESCRIPTION"
  done
  
  if [[ "$UPDATE_WORKFLOW_DEFAULTS" == "true" ]]; then 
      update_workflow_defaults "$app_key" "$APP_VERSION"
  fi
  
  UPDATED_APPS+=("$APP_NAME")
  UPDATED_VERSIONS+=("${app_key}:${APP_VERSION}")
done

if [ ${#UPDATED_APPS[@]} -gt 0 ]; then
  echo "updated_apps=${UPDATED_APPS[*]}" >> "$GITHUB_OUTPUT"
  echo "updated_versions=${UPDATED_VERSIONS[*]}" >> "$GITHUB_OUTPUT"
fi
if [ ${#SKIPPED_APPS[@]} -gt 0 ]; then echo "skipped_apps=${SKIPPED_APPS[*]}" >> "$GITHUB_OUTPUT"; fi
