# Changelog

## [3.0.0] - 2025-01-08
### Added
- **Dynamic Data**: Moved app data to `apps.json` for easier management.
- **Filtering & Sorting**: Users can now filter by category and sort by name/date/size.
- **PWA Updates**: Improved service worker with update notifications.
- **Rate Limiting**: Added client-side download rate limiting.
- **Security**: Enhanced CSP headers and input sanitization.

### Changed
- Refactored `app.js` to be modular and robust.
- Updated `style.css` with container queries and better mobile support.
- Removed timestamp from GitHub release URLs (immutable).

### Fixed
- Improved error handling for network requests.
- Optimized image loading with retry logic.
