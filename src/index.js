import PockitMenubar from './pockitos/pockitmenubar.js';
import PockitApp from './pockitos/pockitapp.js';
import Modal from './pockitos/modal.js';
import SaveMenu from './pockitos/savemenu.js';

// --- Utilities ---
function injectTailwind() {
  const id = 'pockit-tailwind-cdn';
  if (!document.getElementById(id)) {
    const script = document.createElement('script');
    script.id = id;
    script.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(script);
  }
}

// --- Main Class ---
class PockitOS {
  static zIndexCounter = 1000;
  static memory = [];
  static kioskMode = false;
  static _plugin = null;
  static _plugins = [];
  static _menubarPlugins = [];
  static loadMenubarPlugin(fn) {
    if (!PockitOS._menubarPlugins) PockitOS._menubarPlugins = [];
    PockitOS._menubarPlugins.push(fn);
    // Inject into existing menubar if present
    if (window.PockitOS && window.PockitOS._instances) {
      window.PockitOS._instances.forEach(os => {
        const menubar = document.querySelector('.pockit-menubar');
        if (menubar && os) {
          // Find the PockitMenubar instance
          const mb = window.PockitMenubar?.instances?.[0] || null;
          if (mb) {
            try { fn(mb, os); } catch (e) { /* ignore plugin errors */ }
          }
        }
      });
    }
  }

  static setKioskMode(enabled) {
    PockitOS.kioskMode = enabled;
    // Hide/show menubar
    const menubar = document.querySelector('.pockit-menubar');
    if (menubar) menubar.style.display = enabled ? 'none' : '';
    // Hide/show debug window
    const dbg = document.getElementById('pockit-debug-window');
    if (dbg) dbg.style.display = enabled ? 'none' : '';
    // Hide/show all window titlebars
    document.querySelectorAll('.pockit-os-window .title-bar').forEach(bar => {
      bar.style.display = enabled ? 'none' : '';
    });
    // Switch all apps to view mode in kiosk and re-render content
    if (window.PockitOS && window.PockitOS._instances) {
      window.PockitOS._instances.forEach(os => {
        if (os.apps) os.apps.forEach(app => {
          if (enabled) {
            app.setViewMode(false); // force to edit mode first to reset
            app.setViewMode(true);  // then to view mode to re-render
          }
        });
      });
    }
  }

  /**
   * Accepts either a state array or a DOM string (as shown in debug window) for restoration.
   * @param {HTMLElement} container - The container element for the OS windows.
   * @param {Object} options - Options object.
   * @param {Function} [options.onStateChange] - Callback for state changes.
   * @param {Array|String} [options.state] - State array or DOM string for restoration.
   */
  constructor(container = document.body, options = {}) {
    this.container = container;
    this.apps = [];
    this.onStateChange = typeof options.onStateChange === 'function' ? options.onStateChange : null;
    injectTailwind();
    // Track this instance for kiosk mode
    if (typeof window !== 'undefined') {
      if (!window.PockitOS._instances) window.PockitOS._instances = [];
      window.PockitOS._instances.push(this);
    }

    // Add SaveMenu instance
    this.saveMenu = new SaveMenu(PockitOS);

    // If state is a DOM string (starts with <div), parse and restore
    if (typeof options.state === 'string' && options.state.trim().startsWith('<div')) {
      PockitOS.restoreAll(container, options.state);
      return;
    }
    // If state is an array of objects, restore as before
    if (Array.isArray(options.state) && options.state.length > 0) {
      PockitOS.memory = options.state;
      options.state.forEach(s => this.createApp(s));
    } else if (options.state) {
      this.createApp(options.state);
    } else {
      this.createApp();
    }

    if (!document.querySelector('.pockit-menubar')) {
      const menubar = new PockitMenubar(document.body);
      menubar.addMenu('OS', [
        {
          label: 'New Window',
          onClick: () => {
            this.createApp();
          }
        },
        {
          label: 'Save/Load',
          onClick: () => {
            this.saveMenu.show();
          }
        },
        {
          label: 'Kiosk Mode',
          onClick: () => {
            PockitOS.setKioskMode(!PockitOS.kioskMode);
          }
        },
        {
          label: 'About',
          onClick: () => {
            new Modal({
              content: `<div class='text-center'><h2 class='text-lg font-bold mb-2'>About PockitOS</h2><p class='mb-2'><a target="_blank" href="https://github.com/prnthh/PockitOS">PockitOS</a> is a lightweight, modular web OS for running and managing Pockit apps in your browser.</p><p class='text-xs text-gray-500'>© 2025 prnth</p></div>`
            });
          }
        }
      ]);
      // Call all registered menubar plugins
      if (PockitOS._menubarPlugins && Array.isArray(PockitOS._menubarPlugins)) {
        PockitOS._menubarPlugins.forEach(fn => {
          try { fn(menubar, this); } catch (e) { /* ignore plugin errors */ }
        });
      }
    }
    // Remove floating debug window if present
    const dbg = document.getElementById('pockit-debug-window');
    if (dbg) dbg.remove();
    // Hide menubar/debug if kiosk mode is already enabled
    if (PockitOS.kioskMode) {
      PockitOS.setKioskMode(true);
    }
  }

  createApp(state = null) {
    const app = new PockitApp(this.container, state);
    
    // Set up callbacks
    app.onClose = () => {
      const index = this.apps.indexOf(app);
      if (index !== -1) {
        this.apps.splice(index, 1);
      }
      PockitOS.updateMemory(this.onStateChange);
    };
    
    app.onAdd = () => {
      this.createApp();
    };
    
    app.onContentChange = () => {
      PockitOS.updateMemory(this.onStateChange);
    };
    
    app.onFocus = () => {
      app.setZIndex(PockitOS.zIndexCounter++);
      PockitOS.updateMemory(this.onStateChange);
    };
    
    app.onMove = () => {
      PockitOS.updateMemory(this.onStateChange);
    };
    
    // Set initial z-index
    app.setZIndex(PockitOS.zIndexCounter++);
    
    this.apps.push(app);
    return app;
  }

  static updateMemory(onStateChange = null) {
    const allApps = [];
    document.querySelectorAll('.pockit-os-window').forEach(element => {
      const textarea = element.querySelector('textarea');
      allApps.push({
        left: element.style.left,
        top: element.style.top,
        zIndex: element.style.zIndex,
        value: textarea ? textarea.value : '',
        id: element.id
      });
    });
    PockitOS.memory = allApps;
    // Generate the DOM string version (same as debug window)
    const domString = PockitOS.memory.map(state => {
      return `<div style="left:${state.left};top:${state.top};z-index:${state.zIndex};position:absolute;" id="${state.id}">${state.value}</div>`;
    }).join('\n\n');
    if (typeof onStateChange === 'function') {
      onStateChange(domString);
    }
  }

  /**
   * Accepts an optional DOM string to restore from, otherwise uses debug textarea.
   */
  static restoreAll(container = document.body, domString = null) {
    document.querySelectorAll('.pockit-os-window').forEach(el => el.remove());
    let val = domString;
    if (!val) {
      const dbgTextarea = document.getElementById('pockit-debug-textarea');
      if (dbgTextarea) {
        val = dbgTextarea.value.trim();
      }
    }
    if (val && val.startsWith('<div')) {
      const divs = [];
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<root>${val}</root>`, 'text/html');
      const nodes = doc.body.querySelectorAll('root > div');
      nodes.forEach(div => {
        const style = div.getAttribute('style') || '';
        const left = /left:([^;]+);/.exec(style)?.[1]?.trim() || '';
        const top = /top:([^;]+);/.exec(style)?.[1]?.trim() || '';
        const zIndex = /z-index:([^;]+);/.exec(style)?.[1]?.trim() || '';
        const id = div.getAttribute('id') || '';
        let value = Array.from(div.childNodes).map(node => {
          if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'DIV') {
            return node.outerHTML;
          } else if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            return node.outerHTML;
          }
          return '';
        }).join('');
        divs.push({ left, top, zIndex, value, id });
      });
      if (divs.length > 0) {
        PockitOS.memory = divs;
      }
    }
    // Create a new PockitOS instance which will handle the restoration
    const os = new PockitOS(container);
    if (os.apps.length > 0) {
      os.apps[0].element.remove();
      os.apps = [];
    }
    PockitOS.memory.forEach(state => os.createApp(state));
    showDebugWindow();
    updateDebugWindow();
  }

  static loadPlugin(fn, icon = '★') {
    if (!PockitOS._plugins) PockitOS._plugins = [];
    PockitOS._plugins.push({ handler: fn, icon });
    // Inject plugin buttons into all existing apps (no redraw)
    if (window.PockitOS && window.PockitOS._instances) {
      window.PockitOS._instances.forEach(os => {
        if (os.apps) os.apps.forEach(app => app.addPluginButtons());
      });
    }
  }

  static registerMenubarPlugin(fn) {
    if (!PockitOS._menubarPlugins) PockitOS._menubarPlugins = [];
    PockitOS._menubarPlugins.push(fn);
  }
}

export default PockitOS;

// Attach to window for UMD/global usage
if (typeof window !== 'undefined') {
  window.PockitOS = PockitOS;
  window.PockitApp = PockitApp;
  window.Modal = Modal;
}