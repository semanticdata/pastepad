# Changelog

All notable changes to this project extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- View paste in browser command (opens `https://{address}.paste.lol/{title}`)
- Test suite covering paste commands
- Right-click context menu for paste items in tree view
- Localization support with `package.nls.json` for better maintainability
- Spanish localization support with `package.nls.es.json`

### Changed

- Moved all user-facing strings to localization file per VS Code best practices

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
