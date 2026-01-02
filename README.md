> [!IMPORTANT]
> OAuth authentication is not yet available. PastePad currently supports API Key authentication only. Please use "Sign in with API Key" to authenticate.

> [!WARNING]
> PastePad is still in early development and may contain bugs or incomplete features. See the [TODO list](#todo).

# PastePad

**Manage your omg.lol pastebin directly from VS Code.**

PastePad is a VS Code extension that allows you to seamlessly interact with your [omg.lol](https://omg.lol/) [pastebin](https://paste.lol/) without leaving your editor. View, create, edit, and delete your pastes with ease.

## Features

PastePad puts your omg.lol pastebin right in VS Code so you can work with code snippets without switching contexts.

- **Browse pastes** from the activity bar tree view
- **Create new pastes** or edit existing ones as editor tabs
- **Save changes** with `Ctrl+S` – they sync back to your pastebin automatically
- **Toggle visibility** to make pastes public (listed) or private (unlisted)
- **Group pastes** by visibility status to keep things organized
- **Force sync** with `Ctrl+Shift+S` when you need immediate control
- **Syntax highlighting** detects the language from your paste title's file extension

## Requirements

- An [omg.lol](https://omg.lol/) account
- Visual Studio Code version 1.104.0 or higher

## Installation

> [!NOTE]
> PastePad is not yet available in the VS Code Marketplace. To install it manually, follow these steps:

1. Clone this repository: `git clone https://github.com/semanticdata/pastepad.git`
2. Open the repository in VS Code
3. Press `F5` to launch the extension in a new VS Code window (Extension Development Host)
4. The extension will be loaded and ready to use in the new window

## Usage

### Getting Started

1. Install the extension
2. Click the PastePad icon in the activity bar
3. Click "Authenticate with omg.lol" and sign in
4. Your pastes will appear in the tree view

### Commands

- **New Paste** - Create a new paste (click the + icon in the tree view)
- **Open Paste** - Open a paste for editing (click the paste title)
- **Save Paste** - Save changes (`Ctrl+S` or click the save icon)
- **Force Sync** - Manually sync changes (`Ctrl+Shift+S`)
- **Toggle Visibility** - Switch a paste between listed/unlisted
- **Delete Paste** - Remove a paste
- **Refresh** - Refresh the paste list
- **Logout** - Sign out of your omg.lol account

### Keyboard Shortcuts

| Command    | Shortcut       |
| ---------- | -------------- |
| Save Paste | `Ctrl+S`       |
| Force Sync | `Ctrl+Shift+S` |

## Notes

This extension uses the undocumented `listed` attribute implementation from [omglolapi](https://github.com/rknightuk/omglolcli).

Inspired by [GistPad](https://github.com/lostintangent/gistpad).

## License

[MIT License](LICENSE)

## Community & Support

PastePad is a free and open-source project built for the [omg.lol](https://omg.lol/) community. We believe in the power of collaboration and welcome contributions of all kinds. Whether you're a developer, a designer, or just an enthusiastic user, you can help shape the future of this extension.

<details>
<summary><h2>TODO</h2></summary>

Some items remaining before release:

- [ ] Set up OAuth application with omg.lol and configure credentials in [authentication.ts](src/authentication.ts)
- [x] Remove debug console.log statements
- [ ] Update version to 1.0.0
- [ ] Create extension icons
- [ ] Take screenshots for documentation
- [ ] Lower VS Code minimum version for compatibility
- [x] Revisit keywords and categories
- [x] Revisit marketing copy
- [ ] Test on different VS Code versions
- [x] Create simple CONTRIBUTING.md
- [x] Consider creating SECURITY.md
- [ ] Submit to VS Code Marketplace
- [ ] Consider migrating source code to [SourceTube](https://source.tube/)

</details>
