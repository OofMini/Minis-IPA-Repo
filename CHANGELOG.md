# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1] - 2026-01-14
### Fixed
- Fixed CSP violations (inline scripts/styles) in `app.js` and `index.html`.
- Fixed image layout issues in `style.css` (centering).
- Fixed SideStore manifest validation (removed AppStore++).
- Fixed workflow automation to target `apps.json` instead of HTML parsing.

## [3.0.0] - 2025-11-12
### Added
- **Dynamic Data Source:** Migrated from hardcoded JS arrays to `apps.json`.
- **Rate Limiting:** Implemented client-side limits (5 downloads / 5 mins).
- **Skeleton Loading:** Added shimmer animations for better perceived performance.
- **Repository Automation:** Added GitHub Actions for bulk updates and log cleanup.
- **Global Error Handling:** Added fallback for broken image links.

### Changed
- **Architecture:** Refactored into a modular PWA structure.
- **Styling:** Complete UI overhaul with Dark Mode and animated gradients.
- **Service Worker:** Updated to v3 with Stale-While-Revalidate strategy.

### Removed
- Hardcoded app data in `app.js`.
- Legacy `index.html` manual editing workflows.

## [2.0.0] - 2025-08-01
### Added
- Initial PWA support (manifest.json, sw.js).
- Basic search functionality.

## [1.0.0] - 2025-06-15
### Added
- Initial release.