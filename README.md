# PockitOS

A lightweight WYSIWYG environment for building and displaying webapps.

## Features

- Drag-and-drop webapp builder
- Plugin support (AI, Menubar, etc.)
- Easily embeddable in any web page

## Quick Start

You can use PockitOS directly from a CDN with no build step required.

### CDN Usage

Add the following to your HTML:

```html
<!-- Tailwind CSS (required, for styling) -->
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<!-- PockitOS from CDN -->
<script src="https://unpkg.com/pockit-os@latest/dist/index.umd.js"></script>
```

### Basic Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>PockitOS App</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <script src="https://unpkg.com/pockit-os@latest/dist/index.umd.js"></script>
  <script>
    // --- PockitOS Initialization ---
    const initialState = '<div style="left:68px;top:60px;z-index:1000;">hello world!</div>';
    const os = new PockitOS(document.body, {
      onStateChange: function(state) {
        // State change effect (e.g., autosave)
      },
      state: initialState
    });
  </script>
</body>
</html>
```

### Loading Plugins

You can load plugins using the PockitOS API. For example:

```js
// Load a menubar plugin
import { registerAppsMenu } from './plugins/apps.js';
PockitOS.loadMenubarPlugin(registerAppsMenu);

// Load an AI modal plugin
import { aiModalPlugin } from './plugins/llm.js';
PockitOS.loadPlugin(aiModalPlugin, '🤖');
```

### Loading and Saving State

You can programmatically load and save the PockitOS state using the API:

```js
// Initialize with a saved state
const savedState = localStorage.getItem('pockit-state');
const os = new PockitOS(document.body, {
  state: savedState || '<div>Welcome!</div>',
  onStateChange: function(newState) {
    // Save state to localStorage (or your backend)
    localStorage.setItem('pockit-state', newState);
  }
});
```

This allows you to persist the user's workspace between sessions.

### Kiosk Mode

Kiosk mode provides a fullscreen, distraction-free experience by hiding the menubar, debug window, and window titlebars.

You can activate or deactivate kiosk mode programmatically:

```js
// Enable kiosk mode
PockitOS.setKioskMode(true);

// Disable kiosk mode
PockitOS.setKioskMode(false);
```

You can also toggle kiosk mode from the OS menu in the menubar if you are using the default UI.

## Development

Clone the repo and run locally:

```sh
git clone https://github.com/yourusername/PockitWorld.git
cd PockitWorld
npm install
npm run dev
```