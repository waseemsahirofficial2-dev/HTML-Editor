# HTML Editor — Find & Replace

A lightweight browser-based HTML editor designed for GitHub Pages.

## Features

- Drag & drop `.html` / `.htm` files
- Open files from your computer
- Edit the raw HTML source
- Find text
- Replace one occurrence
- Replace all occurrences
- Case-sensitive search
- Whole-word search
- JavaScript regular expressions
- Find next / previous
- Match counter
- HTML preview
- Lightweight HTML formatter
- Reset to the original file
- Download the edited HTML
- Keyboard shortcuts
- No backend
- No database
- No API
- No dependencies
- Files remain on your device

## Deploy on GitHub Pages

1. Create a new GitHub repository.
2. Upload:
   - `index.html`
   - `style.css`
   - `app.js`
   - `README.md`
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
5. Save.
6. GitHub will provide your Pages URL.

## Important

This app does not upload your HTML file anywhere. File reading, editing, previewing and downloading happen in your browser.

The preview uses an iframe sandbox. If the HTML contains scripts, some browser behavior may be restricted by the sandbox.
