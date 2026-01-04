> [!IMPORTANT]
> OAuth authentication is not yet available. PastePad currently supports API Key authentication only.

> [!WARNING]
> PastePad is still in early development and may contain bugs or incomplete features.

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
- **View in browser** to see your pastes live on paste.lol
- **Syntax highlighting** detects the language from your paste title's file extension

## Requirements

- An [omg.lol](https://omg.lol/) account
- Visual Studio Code version 1.84.0 or higher

## Extension Settings

- `pastepad.defaultListNewPastes`: Control whether new pastes are listed (public) or unlisted (private) by default
- `pastepad.groupPastesByVisibility`: Group pastes by visibility status in the tree view
- `pastepad.sortBy`: Sort pastes by 'modified', 'name', or 'created' date

## Installation

> [!NOTE]
> PastePad is not yet available in the VS Code Marketplace.

### Install from VSIX (Recommended)

1. Download the `.vsix` file from the [latest release](https://github.com/semanticdata/pastepad/releases/latest)
2. Open VS Code
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the Command Palette
4. Type "Extensions: Install from VSIX..."
5. Select the downloaded `.vsix` file
6. Reload VS Code when prompted

### Install from Source

> [!TIP]
> You can also install PastePad directly from source!

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

- `pastepad.newPaste` - Create a new paste
- `pastepad.openPaste` - Open a paste for editing  
- `pastepad.viewInBrowser` - Open paste in default browser
- `pastepad.savePaste` - Save changes to current paste
- `pastepad.forceSync` - Manually sync all changes
- `pastepad.toggleVisibility` - Switch paste between listed/unlisted
- `pastepad.deletePaste` - Remove a paste
- `pastepad.refresh` - Refresh the paste list
- `pastepad.authenticate` - Sign in to omg.lol account
- `pastepad.logout` - Sign out of omg.lol account

### Keyboard Shortcuts

- `Ctrl+S` - Save Paste
- `Ctrl+Shift+S` - Force Sync

## Feedback & Support

- Report Issues: [GitHub Issues](https://github.com/semanticdata/pastepad/issues)
- Feature Requests: [GitHub Discussions](https://github.com/semanticdata/pastepad/discussions)
- Community: Join the [omg.lol Discord](https://discord.gg/omglol)

## Acknowledgments

Uses the undocumented `listed` attribute implementation from [omglolapi](https://github.com/rknightuk/omglolcli).

Inspired by [GistPad](https://github.com/lostintangent/gistpad).

## License

[MIT License](LICENSE)

---

**Made with ❤️ for the [omg.lol](https://omg.lol/) community**
