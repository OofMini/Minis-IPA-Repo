#!/bin/bash
# PROFESSIONAL GRADE: Strict Mode & Error Handling
set -euo pipefail
IFS=$'\n\t'

# Cleanup trap
cleanup() {
    local exit_code=$?
    rm -f *.tmp *.bak
    if [ $exit_code -ne 0 ]; then
        echo "::error::Script failed unexpectedly at line $LINENO"
    fi
    exit $exit_code
}
trap cleanup EXIT INT TERM

# Install dependencies
if ! command -v jq &> /dev/null; then
    echo "📦 Installing jq..."
    sudo apt-get update -qq
    sudo apt-get install -y jq
fi

echo "🔍 Validating inputs..."

validate_version() {
  local version="$1"
  local app_name="$2"
  if [[ -z "$version" ]]; then echo "::error::$app_name version cannot be empty"; exit 1; fi
  
  if [[ ! "$version" =~ ^[vV]?[0-9]+(\.[0-9]+)*([-a-zA-Z0-9]+)?$ ]]; then
    echo "::warning::$app_name version '$version' uses a non-standard format."
  fi

  if [[ ${#version} -gt 30 ]]; then
    echo "::error::$app_name version string too long"
    exit 1
  fi
}

ANY_ENABLED=false
if [[ "${UPDATE_SPOTIFY:-false}" == "true" ]]; then ANY_ENABLED=true; validate_version "${SPOTIFY_IPA_VERSION:-}" "Spotify"; fi
if [[ "${UPDATE_YOUTUBE:-false}" == "true" ]]; then ANY_ENABLED=true; validate_version "${YOUTUBE_IPA_VERSION:-}" "YouTube"; fi
if [[ "${UPDATE_X:-false}" == "true" ]]; then ANY_ENABLED=true; validate_version "${X_IPA_VERSION:-}" "X"; fi
if [[ "${UPDATE_YTMUSICULTIMATE:-false}" == "true" ]]; then ANY_ENABLED=true; validate_version "${YTMUSICULTIMATE_IPA_VERSION:-}" "YTMusic"; fi
if [[ "${UPDATE_SCINSTA:-false}" == "true" ]]; then ANY_ENABLED=true; validate_version "${SCINSTA_IPA_VERSION:-}" "SCInsta"; fi

if [[ "$ANY_ENABLED" == "false" ]]; then echo "::notice::No apps enabled for update. Exiting."; exit 0; fi

if [ -n "${GITHUB_ACTIONS:-}" ]; then
    git config --local user.email "github-actions[bot]@users.noreply.github.com"
    git config --local user.name "github-actions[bot]"
fi

CURRENT_DATE=$(date -u +"%Y-%m-%d")

APP_KEYS=("spotify" "youtube" "x" "ytmusicultimate" "scinsta")
declare -A APP_NAMES=( ["spotify"]="EeveeSpotify" ["youtube"]="YTLite" ["x"]="NeoFreeBird" ["ytmusicultimate"]="YTMusicUltimate" ["scinsta"]="SCInsta" )
declare -A APP_BUNDLES=( ["spotify"]="com.spotify.client" ["youtube"]="com.google.ios.youtube" ["x"]="com.atebits.Tweetie2" ["ytmusicultimate"]="com.google.ios.youtubemusic" ["scinsta"]="com.burbn.instagram" )
declare -A APP_IDS=( ["spotify"]="eeveespotify" ["youtube"]="ytlite" ["x"]="neofreebird" ["ytmusicultimate"]="ytmusicultimate" ["scinsta"]="scinsta" )
declare -A APP_URL_PATTERNS=(
  ["spotify"]="static:https://github.com/OofMini/eeveespotifyreborn/releases/download/New/EeveeSpotify.ipa"
  ["youtube"]="dynamic:https://github.com/OofMini/YTLite/releases/download/New/YouTubePlus_{version}.ipa"
  ["x"]="static:https://github.com/OofMini/tweak/releases/download/New/NeoFreeBird-sideloaded.ipa"
  ["ytmusicultimate"]="static:https://github.com/OofMini/YTMusicUltimate/releases/download/New/YTMusicUltimate.ipa"
  ["scinsta"]="dynamic:https://github.com/OofMini/SCInsta/releases/download/New/SCInsta_{version}.ipa"
)
declare -A APP_DESCRIPTIONS=(
  ["spotify"]="Tweaked Spotify with premium features unlocked, no ads, and enhanced playback. Spotify IPA %s, EeveeSpotify %s."
  ["youtube"]="Tweaked YouTube with background playback, no ads, and picture-in-picture. YouTube IPA %s, YTLite %s."
  ["x"]="Tweaked Twitter/X with premium features and more. X IPA %s, NeoFreeBird %s."
  ["ytmusicultimate"]="Tweaked YouTube Music with premium features unlocked, background playback, and no ads. Youtube Music IPA %s, YTMusicUltimate %s."
  ["scinsta"]="Tweaked Instagram premium, Instagram IPA %s, SCInsta %s"
)
declare -A APP_TOGGLES=( ["spotify"]="${UPDATE_SPOTIFY:-false}" ["youtube"]="${UPDATE_YOUTUBE:-false}" ["x"]="${UPDATE_X:-false}" ["ytmusicultimate"]="${UPDATE_YTMUSICULTIMATE:-false}" ["scinsta"]="${UPDATE_SCINSTA:-false}" )
declare -A APP_IPA_VERSIONS=( ["spotify"]="${SPOTIFY_IPA_VERSION:-}" ["youtube"]="${YOUTUBE_IPA_VERSION:-}" ["x"]="${X_IPA_VERSION:-}" ["ytmusicultimate"]="${YTMUSICULTIMATE_IPA_VERSION:-}" ["scinsta"]="${SCINSTA_IPA_VERSION:-}" )
declare -A APP_TWEAK_VERSIONS=( ["spotify"]="${SPOTIFY_TWEAK_VERSION:-}" ["youtube"]="${YOUTUBE_TWEAK_VERSION:-}" ["x"]="${X_TWEAK_VERSION:-}" ["ytmusicultimate"]="${YTMUSICULTIMATE_TWEAK_VERSION:-}" ["scinsta"]="${SCINSTA_TWEAK_VERSION:-}" )

build_download_url() {
  local app_key="$1" tweak_version="$2" pattern="${APP_URL_PATTERNS[$app_key]}"
  if [[ "$pattern" == static:* ]]; then echo "${pattern#static:}"; elif [[ "$pattern" == dynamic:* ]]; then
    local template="${pattern#dynamic:}" version_clean="${tweak_version#v}"
    echo "${template//\{version\}/$version_clean}"
  fi
}

generate_description() {
  local app_key="$1" ipa_ver="$2" tweak_ver="$3" template="${APP_DESCRIPTIONS[$app_key]}"
  printf "$template" "$ipa_ver" "$tweak_ver"
}

update_app_in_file() {
  local file="$1" app_name="$2" bundle_id="$3" app_id="$4" ipa_ver="$5" url="$6" desc="$7" temp_file="${file}.tmp"
  
  if [ ! -f "$file" ]; then return 0; fi

  case "$file" in
    "sidestore.json") 
        if ! jq -e --arg app "$app_name" --arg bundle "$bundle_id" '.apps[] | select(.name == $app or .bundleIdentifier == $bundle)' "$file" >/dev/null 2>&1; then
            return 0
        fi
        
        jq --arg app "$app_name" --arg bundle "$bundle_id" --arg version "$ipa_ver" --arg url "$url" --arg desc "$desc" --arg date "$CURRENT_DATE" \
         '(.apps[] | select(.name == $app or .bundleIdentifier == $bundle)) |= (.versions[0].version = $version | .versions[0].downloadURL = $url | .versions[0].date = $date | .localizedDescription = $desc)' "$file" > "$temp_file" 
        ;;
    "trollapps.json") 
        if ! jq -e --arg app "$app_name" --arg bundle "$bundle_id" '.apps[] | select(.name == $app or .bundleIdentifier == $bundle)' "$file" >/dev/null 2>&1; then
            return 0
        fi

        jq --arg app "$app_name" --arg bundle "$bundle_id" --arg version "$ipa_ver" --arg url "$url" --arg desc "$desc" --arg date "$CURRENT_DATE" \
         '(.apps[] | select(.name == $app or .bundleIdentifier == $bundle)) |= (.version = $version | .downloadURL = $url | .localizedDescription = $desc | .versionDate = $date)' "$file" > "$temp_file" 
        ;;
  esac
  
  if [ -f "$temp_file" ]; then
      if ! jq empty "$temp_file" 2>/dev/null; then 
          echo "::error::Invalid JSON generated for $file"; rm -f "$temp_file"; return 1; 
      fi
      if ! cmp -s "$file" "$temp_file"; then 
          mv "$temp_file" "$file"; echo "✅ Updated $app_name in $file"; 
      else 
          rm -f "$temp_file"; 
      fi
  fi
}

validate_json_files() {
    for file in sidestore.json trollapps.json; do
        if [ ! -f "$file" ]; then continue; fi
        if ! jq empty "$file" 2>/dev/null; then
            echo "::error::$file is corrupted before updates"
            exit 1
        fi
    done
}

update_workflow_defaults() {
  local app_key="$1" ipa_ver="$2" tweak_ver="$3" workflow_file=".github/workflows/bulk-tweaked-apps-updates.yml"
  if [ ! -f "$workflow_file" ]; then return 0; fi
  
  local escaped_ipa
  local escaped_tweak
  escaped_ipa=$(printf '%s\n' "$ipa_ver" | sed 's/[[\.*^$/]/\\&/g')
  escaped_tweak=$(printf '%s\n' "$tweak_ver" | sed 's/[[\.*^$/]/\\&/g')
  
  sed -i -e "/${app_key}_ipa_version:/,/default:/ s/\(default: \)\"[^\"]*\"/\1\"$escaped_ipa\"/" \
         -e "/${app_key}_tweak_version:/,/default:/ s/\(default: \)\"[^\"]*\"/\1\"$escaped_tweak\"/" "$workflow_file"
}

validate_json_files

JSON_FILES=("sidestore.json" "trollapps.json")
UPDATED_APPS=(); UPDATED_VERSIONS=(); SKIPPED_APPS=()

for app_key in "${APP_KEYS[@]}"; do
  if [[ "${APP_TOGGLES[$app_key]}" != "true" ]]; then SKIPPED_APPS+=("${APP_NAMES[$app_key]}"); continue; fi
  IPA="${APP_IPA_VERSIONS[$app_key]}"
  TWEAK="${APP_TWEAK_VERSIONS[$app_key]}"
  APP_ID="${APP_IDS[$app_key]}"
  URL=$(build_download_url "$app_key" "$TWEAK")
  DESC=$(generate_description "$app_key" "$IPA" "$TWEAK")
  
  for json_file in "${JSON_FILES[@]}"; do 
      update_app_in_file "$json_file" "${APP_NAMES[$app_key]}" "${APP_BUNDLES[$app_key]}" "$APP_ID" "$IPA" "$URL" "$DESC"
  done
  
  if [[ "${UPDATE_WORKFLOW_DEFAULTS:-false}" == "true" ]]; then 
      update_workflow_defaults "$app_key" "$IPA" "$TWEAK"
  fi
  
  UPDATED_APPS+=("${APP_NAMES[$app_key]}")
  UPDATED_VERSIONS+=("${app_key}:${IPA}:${TWEAK}")
done

if [ ${#UPDATED_APPS[@]} -gt 0 ]; then echo "updated_apps=${UPDATED_APPS[*]}" >> "$GITHUB_OUTPUT"; fi
if [ ${#SKIPPED_APPS[@]} -gt 0 ]; then echo "skipped_apps=${SKIPPED_APPS[*]}" >> "$GITHUB_OUTPUT"; fi
