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
  static _instances = [];
  static onStateChange = null; // Store global onStateChange
  static loadMenubarPlugin(fn) {
    if (!PockitOS._menubarPlugins) PockitOS._menubarPlugins = [];
    PockitOS._menubarPlugins.push(fn);
    // Inject into existing menubar if present
    if (PockitOS._instances && PockitOS._instances.length) {
      PockitOS._instances.forEach(os => {
        const menubar = document.querySelector('.pockit-menubar');
        if (menubar && os) {
          // Find the PockitMenubar instance
          const mb = (typeof window !== 'undefined' ? window.PockitMenubar?.instances?.[0] : null) || null;
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
    if (PockitOS._instances && PockitOS._instances.length) {
      PockitOS._instances.forEach(os => {
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
   * @param {Object} [osMenuOptions] - Additional OS menu options (e.g., { resetMemory: true })
   */
  constructor(container = document.body, options = {}, osMenuOptions = {}) {
    this.container = container;
    this.apps = [];
    this.onStateChange = typeof options.onStateChange === 'function' ? options.onStateChange : null;
    if (this.onStateChange) {
      PockitOS.onStateChange = this.onStateChange;
    }
    injectTailwind();
    // --- Drag-and-drop support for creating new apps ---
    this._setupDragAndDrop();
    // Track this instance for kiosk mode
    if (!PockitOS._instances) PockitOS._instances = [];
    PockitOS._instances.push(this);

    // Add SaveMenu instance
    this.saveMenu = new SaveMenu(this);

    // --- Fix: Always run menubar/plugin setup, even if restoring from DOM string ---
    let restoringFromDOM = false;
    if (typeof options.state === 'string' && options.state.trim().startsWith('<div')) {
      restoringFromDOM = true;
      // Set a flag so restoreAll knows not to create a new PockitOS
      this._restoringFromDOM = true;
      this.restoreAll(container, options.state);
    }
    // If state is an array of objects, restore as before
    else if (Array.isArray(options.state) && options.state.length > 0) {
      PockitOS.memory = options.state;
      options.state.forEach(s => this.createApp(s));
    } else if (options.state) {
      this.createApp(options.state);
    } else if (!restoringFromDOM) {
      this.createApp();
    }

    if (!document.querySelector('.pockit-menubar')) {
      const menubar = new PockitMenubar(document.body);
      const osMenuItems = [
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
      ];
      // Add custom menu items from osMenuOptions (function pairs)
      if (osMenuOptions && typeof osMenuOptions === 'object') {
        Object.entries(osMenuOptions).forEach(([label, fn]) => {
          if (typeof fn === 'function') {
            osMenuItems.push({ label, onClick: fn });
          }
        });
      }
      menubar.addMenu('OS', osMenuItems);
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
      this.updateMemory();
    };
    
    app.onAdd = () => {
      this.createApp();
    };
    
    app.onContentChange = () => {
      this.updateMemory();
    };
    
    app.onFocus = () => {
      app.setZIndex(PockitOS.zIndexCounter++);
      this.updateMemory();
    };
    
    app.onMove = () => {
      this.updateMemory();
    };
    
    app.onDuplicate = (newState) => {
      this.createApp(newState);
      this.updateMemory(); // Ensure duplicated app is saved
    };
    
    // Set initial z-index
    app.setZIndex(PockitOS.zIndexCounter++);
    
    this.apps.push(app);
    return app;
  }

  updateMemory() {
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
    // Sort by x (left), then y (top)
    allApps.sort((a, b) => {
      const ax = parseInt(a.left, 10) || 0;
      const bx = parseInt(b.left, 10) || 0;
      if (ax !== bx) return ax - bx;
      const ay = parseInt(a.top, 10) || 0;
      const by = parseInt(b.top, 10) || 0;
      return ay - by;
    });
    this.memory = allApps;
    // Generate the DOM string version (same as debug window)
    const domString = this.memory.map(state => {
      return `<div style="left:${state.left};top:${state.top};z-index:${state.zIndex};position:absolute;" id="${state.id}">${state.value}</div>`;
    }).join('\n\n');
    if (typeof this.onStateChange === 'function') {
      this.onStateChange(domString);
    }
  }

  /**
   * Accepts an optional DOM string to restore from, otherwise uses debug textarea.
   * Optionally accepts an existing PockitOS instance to avoid double-instantiation.
   */
  restoreAll(container = this.container, domString = null) {
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
        this.memory = divs;
      }
    }
    if (this.apps.length > 0) {
      this.apps[0].element.remove();
      this.apps = [];
    }
    // Restore all apps and set them to view mode
    this.memory.forEach(state => {
      const app = this.createApp(state);
      if (typeof app.setViewMode === 'function') {
        app.setViewMode(true);
      }
    });
    if (typeof showDebugWindow === 'function') showDebugWindow();
    if (typeof updateDebugWindow === 'function') updateDebugWindow();
    // Save state after restore
    this.updateMemory();
  }

  static loadPlugin(fn, icon = '★') {
    if (!PockitOS._plugins) PockitOS._plugins = [];
    PockitOS._plugins.push({ handler: fn, icon });
    // Inject plugin buttons into all existing apps (no redraw)
    if (PockitOS._instances && PockitOS._instances.length) {
      PockitOS._instances.forEach(os => {
        if (os.apps) os.apps.forEach(app => app.addPluginButtons());
      });
    }
  }

  static registerMenubarPlugin(fn) {
    if (!PockitOS._menubarPlugins) PockitOS._menubarPlugins = [];
    PockitOS._menubarPlugins.push(fn);
  }

  // --- Drag-and-drop handler ---
  _setupDragAndDrop() {
    // Ensure body and html fill the viewport for drag-and-drop using .style
    document.documentElement.style.minHeight = '100vh';
    document.body.style.minHeight = '100vh';
    // Attach to document.body so drop works anywhere
    const dropTarget = document.body;
    dropTarget.addEventListener('dragover', e => {
      if (PockitOS.kioskMode) return;
      e.preventDefault();
      console.log('dragover event', e);
    }, true);
    dropTarget.addEventListener('drop', async e => {
      e.preventDefault();
      let content = '';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          content = await new Promise(resolve => {
            reader.onload = ev => resolve(`<img src='${ev.target.result}' style='max-width:100%;max-height:300px;'/>`);
            reader.readAsDataURL(file);
          });
        } else {
          content = file.name;
        }
      } else if (e.dataTransfer.getData('text/html')) {
        content = e.dataTransfer.getData('text/html');
      } else if (e.dataTransfer.getData('text/plain')) {
        content = e.dataTransfer.getData('text/plain');
      }
      if (content) {
        // Use viewport coordinates for drop
        const left = e.clientX + 'px';
        const top = e.clientY + 'px';
        const app = this.createApp({ left, top, value: content });
        if (typeof app.setViewMode === 'function') {
          app.setViewMode(true);
        }
      }
    }, true);
  }
}

export default PockitOS;

// Attach to window for UMD/global usage
if (typeof window !== 'undefined') {
  window.PockitOS = PockitOS;
  window.PockitApp = PockitApp;
  window.Modal = Modal;
}