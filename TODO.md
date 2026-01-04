# TODO

Some items in the checklist are being considered and not necessarily planned. I haven't separated them yet. I'm focusing on the initial marketplace release to allow for even easier testing and feedback from others.

## Pre-Release Checklist

- [ ] Set up OAuth application with omg.lol and configure credentials in `authentication.ts`
- [ ] Update version to 1.0.0
- [ ] Create extension icons
- [ ] Take screenshots for marketplace
- [ ] Lower VS Code minimum version for compatibility
- [ ] Test on different VS Code versions
- [ ] Submit to VS Code Marketplace
- [ ] Consider migrating source code to [SourceTube](https://source.tube/)

## Feature Enhancements

### Status Bar

- [ ] Show connection status indicator
- [ ] Display paste count
- [ ] Quick access to refresh command

### UX Improvements

- [ ] Add copy URL to clipboard command
- [ ] Quick pick for fast paste switching (`Ctrl+P` style)
- [ ] Progress indicators for long operations
- [ ] Notification actions (View in Browser, Copy URL after save)
- [ ] Input validation for paste titles (prevent duplicates)

### Search & Organization

- [ ] Search/filter pastes in tree view
- [ ] Mark pastes as favorites (pin to top)
- [ ] Batch operations (multi-select for delete, visibility change)

### Editor Integration

- [ ] Code lenses showing paste metadata in editor
- [ ] Text decorations for visibility status (already have tree view icon)
- [ ] Webview panel for markdown preview
- [ ] Completion provider for paste references (`@@` trigger)

### Power Features

- [ ] Diff view for local vs remote changes
- [ ] Export pastes as VS Code snippets
- [ ] Paste statistics dashboard
- [ ] Drag-drop files to create pastes

## Technical Debt

- [ ] Add error boundary handling
- [ ] Implement retry logic for failed API calls
- [ ] Research VS Code telemetry for usage analytics (and how to improve without it)
- [ ] Performance optimization for large paste collections
- [ ] Unit test coverage for core modules
- [ ] Integration tests for API calls

## Documentation

- [x] Create CONTRIBUTING.md with contribution guidelines
- [x] Create SECURITY.md with vulnerability reporting
- [ ] Add architecture diagrams (love me a good mermaid diagram)
- [ ] Write API documentation for omg.lol integration
