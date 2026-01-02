# Changelog

All notable changes to this project extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Test suite covering API visibility preservation, paste creation, deletion (6 tests)
- Test suite covering language detection from file extensions (18 tests)

### Changed

- Updated test mocks to match new API response structure with `RetryManager`
- Fixed `workspaceState` mocking for synchronous state management
- Removed boilerplate sample test
- Added debug configuration for running tests with `--disable-extensions`

### Removed

- Reference files and documentation (Postman collections, GistPad reference code, omg.lol API reference)

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
