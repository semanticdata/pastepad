# TODO

## 1.0.0 Release Checklist

### Assets

- [ ] Extension icon (128x128px PNG) - marketplace listing, activity bar
- [ ] Marketplace screenshots:
  - [ ] Paste tree view with context menu
  - [ ] Profile editor with preview panel
  - [ ] Settings/configuration
  - [ ] Example paste being edited
- [ ] Short GIF/demo (as hero?)

### Documentation

- [ ] Update README.md:
  - [ ] Add Profile & /now page sections
  - [ ] Document all config properties (logLevel, profile.autoSync, profile.previewOnOpen)
  - [ ] Add screenshots
- [ ] Complete Spanish localization `package.nls.es.json`
- [ ] Create marketplace listing description

### Testing

- [ ] Test on VS Code 1.107.1 (consider lowering minimum)
- [ ] Test on latest stable VS Code
- [ ] Lower minimum version if compatible
- [ ] Test full authentication flow
- [ ] Test all profile & /now page features

### Release Tasks

- [ ] Verify .vscodeignore excludes dev files only
- [ ] Test installed VSIX before submission
- [ ] Submit to marketplace

### Post-Release (Optional)

- [ ] Apply for featured badge
- [ ] Announce on omg.lol Discourse
- [ ] Consider SourceTube migration

---

## Post-1.0.0 - Backlog of Ideas

### UX Polish

- Copy URL to clipboard command
- Progress indicators for long operations
- Notification actions (View in Browser, Copy URL after save)
- Input validation for paste titles (prevent duplicates)

### Status Bar

- Connection status indicator
- Paste count display
- Quick refresh button

### Search & Organization

- Search/filter/sort pastes in tree view
- Favorites (pin to top)

### Editor Integration

- Code lenses for paste metadata
- Text decorations for visibility status
- Completion provider for paste references (`@@` trigger)

### Power Features

- Diff view (local vs remote)
- Export as VS Code snippets
- Drag-drop files to create pastes
- Drag-drop images to upload to `some.pics`
- Paste statistics dashboard

### Technical Debt

- Error boundary handling
- Performance optimization for large collections
- Unit test coverage expansion
- Integration tests for API calls
- Architecture diagrams (mermaid - I do love me a good diagram)

### Future Enhancements

- OAuth authentication (requires omg.lol app setup)
- Webview markdown preview for pastes similar to profile and now pages
- Quick pick paste switching (Ctrl+P style)
- Telemetry for usage analytics (privacy-respecting if needed)
