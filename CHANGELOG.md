# Changelog

All notable changes to this project extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Profile management support for omg.lol profiles and /now pages
- Profile and /now page tree view in activity bar (separate from pastebin view)
- Open profile command (`pastepad.openProfile`) to edit main profile
- Open /now page command (`pastepad.openNowPage`) to edit /now page
- Live preview panel for profiles and /now pages with markdown rendering
- Profile preview toggle command (`pastepad.previewProfile`) with `Ctrl+Shift+V` shortcut
- Publish profile command (`pastepad.publishProfile`) to force save changes
- View profile in browser command (`pastepad.openProfileInBrowser`)
- Profile picture upload functionality (`pastepad.uploadProfilePicture`) with full multipart/form-data support
- Support for PNG, JPG, GIF, WebP, SVG image formats for profile pictures
- File size validation (5MB limit) for profile picture uploads
- Progress indicators during profile picture upload
- Complete weblog API implementation (9 endpoints) for future weblog features
- Weblog entry management: list, get, create, delete, and latest post retrieval
- Weblog configuration management: get and update weblog settings
- Weblog template management: get and update custom HTML templates
- some.pics API discovery documentation for future picture sharing features
- FileSystemProvider for `omgprofile:` and `omgnow:` schemes
- Automatic 404 handling for profiles and /now pages that don't exist yet
- Support for omg.lol profile placeholders (`{profile-picture}`, `{address}`, `{last-updated}`)
- Profile theme and styling support in preview panel
- Context values (`pastepad.isProfileDocument`, `pastepad.isNowPageDocument`) for UI conditionals
- View paste in browser command (opens `https://{address}.paste.lol/{title}`)
- Test suite covering paste commands
- Right-click context menu for paste items in tree view
- Localization support with `package.nls.json` for better maintainability
- Spanish localization support with `package.nls.es.json`
- TypeScript interfaces for WeblogEntry, WeblogConfiguration, and WeblogTemplate

### Changed

- Extension now activates on startup (`onStartupFinished`) instead of only when views are opened
- Fixed profile API endpoint from `/address/{address}/profile` to `/address/{address}/web`
- Fixed profile update API to include `publish: true` parameter
- Now page API uses correct `listed` parameter format (`'1'` or `'0'` as strings)
- Improved error handling for missing profiles and /now pages
- Profile and /now page commands no longer use i18n placeholders for immediate visibility
- Moved all user-facing strings to localization file per VS Code best practices
- Improved profile cache invalidation after picture upload
- Enhanced error handling for file operations with user-friendly messages

### Fixed

- Profile and /now pages now load correctly (previously returned 404 errors)
- Profile preview panel displays correctly with proper data extraction
- Profile update requests now use the correct API endpoint
- File system providers properly handle empty content for new profiles/now pages
- Profile and /now page preview now reliably opens in split view using `ViewColumn.Beside`
- Preview panel placement is now dynamic and works correctly regardless of active editor column
- Editor opens first in active column, establishing anchor for preview to appear beside it
- Preview preserves focus in editor using `takeFocus: false` parameter
- Completed stubbed profile picture upload command with full implementation

## [0.3.0] - 2026-01-03

### Added

- Logging framework with `LoggerService` singleton
- Configurable log levels (debug, info, warn, error) via VS Code settings
- Structured logging with metadata support and automatic sensitive data redaction
- Output channel logging to VS Code's Output panel (PastePad channel)
- Test suite covering API visibility preservation, paste creation, deletion (6 tests)
- Test suite covering language detection from file extensions (18 tests)

### Changed

- Replaced 19 debug `console.log` statements with logging framework
- Updated test mocks to match new API response structure with `RetryManager`
- Fixed `workspaceState` mocking for synchronous state management
- Removed boilerplate sample test
- Added debug configuration for running tests with `--disable-extensions`
- Temporarily disabled OAuth authentication; only API key authentication is currently available
- OAuth infrastructure preserved in code for future enablement with client_id and client_secret

### Removed

- Reference files and documentation (Postman collections, GistPad reference code, omg.lol API reference)
- Debug console.log statements from production code

## [0.2.0] - 2025-10-15

### Added

- Toggle paste visibility (listed/unlisted)
- Paste grouping and statistics
- Force sync option (`Ctrl+Shift+S`)

### Changed

- Migrated to `FileSystemProvider` for better file handling
- Simplified authentication system
- Improved error handling and retry logic
- Better unsaved state tracking

## [0.1.0] - 2025-09-28

### Added

- Initial project scaffolding with [Yeoman](https://yeoman.io/) and [VS Code Extension Generator](https://www.npmjs.com/package/generator-code)
- Authentication with omg.lol account
- Paste listing in activity bar tree view
- Create, edit, save, and delete pastes
- Auto-sync changes
- Language detection based on paste title file extension
- Keyboard shortcuts (`Ctrl+S` to save)
