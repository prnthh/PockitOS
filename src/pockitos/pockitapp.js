class PockitApp {
  constructor(container, state = null) {
    this.container = container;
    this.state = state;
    this.id = (state && state.id) ? state.id : 'pockit-' + Math.random().toString(36).slice(2, 10);
    this.setup();
  }

  setup() {
    this.element = this.createUI(this.state);
    this.container.appendChild(this.element);
    this.state ? this.setPosition(this.state) : this.centerInContainer();
    this.makeDraggable();
    this.element.id = this.id;
    // Add edit mode bg/blur Tailwind classes by default (edit mode)
    this.element.classList.add('bg-white/60', 'backdrop-blur');
    this.q('textarea').addEventListener('input', () => this.onContentChange?.());
    if (window.PockitOS && Array.isArray(window.PockitOS._plugins)) this.addPluginButtons();
    this.isRendered = false;
    this.setViewMode(false); // Always start in edit mode and sync icon
  }

  // Dynamically add plugin buttons for all loaded plugins
  addPluginButtons() {
    if (!window.PockitOS || !Array.isArray(window.PockitOS._plugins)) return;
    const btns = this.element.querySelector('.buttons');
    if (!btns) return;
    window.PockitOS._plugins.forEach((plugin, idx) => {
      // Avoid duplicate buttons
      if (btns.querySelector(`.btn-plugin[data-plugin-idx="${idx}"]`)) return;
      const btn = document.createElement('button');
      btn.className = 'btn-plugin w-6 h-6 flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 transition mr-1';
      btn.style.borderRadius = '0';
      btn.setAttribute('data-plugin-idx', idx);
      btn.innerHTML = plugin.icon || '★';
      btn.onclick = () => plugin.handler(this);
      btns.insertBefore(btn, btns.firstChild);
    });
  }

  createUI(state = null) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pockit-os-window fixed min-w-[300px] min-h-[150px]';
    wrapper.style.cssText = 'z-index:1000;position:absolute;border:none;';
    const idToShow = this.id;
    // Build buttons HTML, plugin button if plugin loaded at OS level
    let pluginBtnHtml = '';
    if (window.PockitOS && window.PockitOS._plugin) {
      pluginBtnHtml = `<button class="btn-plugin w-6 h-6 flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 transition mr-1" style="border-radius:0;">★</button>`;
    }
    // Change: btn-eye icon is a right arrow (▶) in edit mode
    wrapper.innerHTML = `
      <div class="title-bar flex items-center justify-between px-3 py-2 bg-gray-800 cursor-move select-none" style="border-radius:0;padding:0;opacity:1;">
        <span class='text-xs text-gray-300 ml-2 pockit-id-span'>[${idToShow}]</span>
        <div class="buttons flex">
          ${pluginBtnHtml}
          <button class="btn-add w-6 h-6 flex items-center justify-center bg-green-500 hover:bg-green-600 transition" style="border-radius:0;">👯‍♀️</button>
          <button class="btn-eye w-6 h-6 flex items-center justify-center bg-blue-500 hover:bg-blue-600 transition" style="border-radius:0;">✏️</button>
          <button class="btn-close w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 transition" style="border-radius:0;">🗑️</button>
        </div>
      </div>
      <div class="content text-gray-800" style="padding:0;">
        <textarea class="w-full h-32 border border-gray-300 mb-0" style="resize: both;" placeholder="Type here...">${state?.value||''}</textarea>
        <div class="rendered-content w-full min-h-32 p-[1px]" style="display:none;white-space:pre-wrap;"></div>
      </div>
    `;
    this.attachIdEditHandler(wrapper.querySelector('.pockit-id-span'));
    wrapper.querySelector('.btn-close').onclick = () => { wrapper.remove(); this.onClose?.(); };
    wrapper.querySelector('.btn-add').onclick = () => {
      // Duplicate logic: get state, offset, and call onDuplicate
      const state = this.getState();
      // Parse left/top as px, offset by +30px right, -30px up
      const left = (parseInt(state.left, 10) || 0) + 30;
      const top = (parseInt(state.top, 10) || 0) - 30;
      const newState = { ...state, left: left + 'px', top: top + 'px', id: undefined };
      this.onDuplicate?.(newState);
    };
    wrapper.querySelector('.btn-eye').onclick = () => {
      this.setViewMode(!this.isRendered);
    };
    wrapper.querySelector('textarea').addEventListener('input', () => { if (this.isRendered) this.setViewMode(true); });
    // Plugin button handler
    if (window.PockitOS && window.PockitOS._plugin) {
      const btnPlugin = wrapper.querySelector('.btn-plugin');
      if (btnPlugin) btnPlugin.onclick = () => window.PockitOS._plugin(this);
    }
    return wrapper;
  }

  attachIdEditHandler(span) {
    span.ondblclick = () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = this.id;
      input.className = 'text-xs text-gray-800 ml-2 pockit-id-input';
      input.style.cssText = `width:${Math.max(60, this.id.length*8)}px;color:#fff;background:transparent;`;
      span.replaceWith(input);
      input.focus(); input.select();
      const saveId = () => {
        this.setId(input.value.trim());
        const newSpan = document.createElement('span');
        newSpan.className = 'text-xs text-gray-300 ml-2 pockit-id-span';
        newSpan.textContent = `[${this.id}]`;
        this.attachIdEditHandler(newSpan);
        input.replaceWith(newSpan);
      };
      input.addEventListener('blur', saveId);
      input.addEventListener('keydown', ev => ev.key === 'Enter' && input.blur());
    };
  }

  centerInContainer() {
    Object.assign(this.element.style, { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' });
  }

  setPosition(state) {
    Object.assign(this.element.style, { left: state.left||'50%', top: state.top||'50%', transform: '' });
    if (state.zIndex) this.element.style.zIndex = state.zIndex;
  }

  makeDraggable() {
    const el = this.element, bar = el.querySelector('.title-bar');
    let offsetX = 0, offsetY = 0, isDragging = false;
    const GRID = 20; // px
    let shiftKey = false;

    const snap = v => Math.round(v / GRID) * GRID;

    // Store handlers for later removal
    this._dragHandlers = this._dragHandlers || {};

    const startDrag = (pageX, pageY, shift = false) => {
      // If transform is present, convert to pixel position and remove transform
      if (el.style.transform && el.style.transform.includes('translate')) {
        const containerRect = el.offsetParent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        el.style.left = (elRect.left - containerRect.left) + 'px';
        el.style.top = (elRect.top - containerRect.top) + 'px';
        el.style.transform = '';
      }
      offsetX = pageX - el.offsetLeft;
      offsetY = pageY - el.offsetTop;
      isDragging = true;
      shiftKey = shift;
      this.onFocus?.();
    };

    const moveDrag = (pageX, pageY, shift = false) => {
      if (!isDragging) return;
      let left = pageX - offsetX;
      let top = pageY - offsetY;
      if (shift || shiftKey) {
        left = snap(left);
        top = snap(top);
      }
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      this.onMove?.();
    };

    const stopDrag = () => { isDragging = false; };

    // Mouse handlers
    this._dragHandlers.mouseDown = e => {
      if (!this._draggableEnabled) return;
      startDrag(e.pageX, e.pageY, e.shiftKey);
      const onMove = e => moveDrag(e.pageX, e.pageY, e.shiftKey);
      const onUp = () => { stopDrag(); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
    // Touch handlers
    this._dragHandlers.touchStart = e => {
      if (!this._draggableEnabled) return;
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      startDrag(touch.pageX, touch.pageY, shiftKey);
      const onMove = e => {
        if (e.touches.length !== 1) return;
        moveDrag(e.touches[0].pageX, e.touches[0].pageY, shiftKey);
      };
      const onUp = () => { stopDrag(); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp); };
      document.addEventListener('touchmove', onMove);
      document.addEventListener('touchend', onUp);
    };
    // Shift key tracking
    this._dragHandlers.keyDown = e => { if (e.key === 'Shift') shiftKey = true; };
    this._dragHandlers.keyUp = e => { if (e.key === 'Shift') shiftKey = false; };

    // Attach by default (edit mode)
    this.enableDraggable(true);
  }

  enableDraggable(enable) {
    const el = this.element, bar = el.querySelector('.title-bar');
    this._draggableEnabled = enable;
    if (!this._dragHandlers) return;
    if (enable) {
      bar.addEventListener('mousedown', this._dragHandlers.mouseDown);
      bar.addEventListener('touchstart', this._dragHandlers.touchStart);
      window.addEventListener('keydown', this._dragHandlers.keyDown);
      window.addEventListener('keyup', this._dragHandlers.keyUp);
    } else {
      bar.removeEventListener('mousedown', this._dragHandlers.mouseDown);
      bar.removeEventListener('touchstart', this._dragHandlers.touchStart);
      window.removeEventListener('keydown', this._dragHandlers.keyDown);
      window.removeEventListener('keyup', this._dragHandlers.keyUp);
    }
  }

  q(sel) { return this.element.querySelector(sel); }

  getContent() { return this.q('textarea')?.value || ''; }
  setContent(content) { if (this.q('textarea')) this.q('textarea').value = content; }
  getState() { return { left: this.element.style.left, top: this.element.style.top, zIndex: this.element.style.zIndex, value: this.getContent(), id: this.id }; }
  setZIndex(z) { this.element.style.zIndex = z; }

  // Helper to update memory after any mutation
  updateMemory() {
    if (window.PockitOS && typeof window.PockitOS.updateMemory === 'function') {
      window.PockitOS.updateMemory(window.PockitOS._instances?.[0]?.onStateChange);
    }
  }

  setId(newId) {
    if (!newId) return;
    this.id = newId;
    this.element.id = this.id;
    const idSpan = this.q('.pockit-id-span');
    if (idSpan) idSpan.textContent = `[${this.id}]`;
    this.onContentChange?.();
    this.updateMemory();
  }

  setViewMode(isView) {
    const btnEye = this.q('.btn-eye'), textarea = this.q('textarea'), renderedDiv = this.q('.rendered-content'), titleBar = this.q('.title-bar');
    if (!btnEye) return;
    const wrapper = this.element;
    this._injectedModuleScripts?.forEach(s => s.remove());
    this._injectedModuleScripts = [];
    if (isView) {
      renderedDiv.innerHTML = '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = textarea.value;
      tempDiv.querySelectorAll('script').forEach(script => {
        const newScript = document.createElement('script');
        for (const attr of script.attributes) newScript.setAttribute(attr.name, attr.value);
        newScript.textContent = script.textContent;
        if (script.type === 'importmap') {
          if (!document.querySelector('script[type="importmap"][data-pockit]')) {
            newScript.setAttribute('data-pockit', 'true');
            document.head.appendChild(newScript);
            (this._injectedModuleScripts ||= []).push(newScript);
          }
        } else {
          document.body.appendChild(newScript);
          (this._injectedModuleScripts ||= []).push(newScript);
        }
        script.remove();
      });
      while (tempDiv.firstChild) renderedDiv.appendChild(tempDiv.firstChild);
      textarea.style.display = 'none';
      renderedDiv.style.display = '';
      if (titleBar) {
        titleBar.style.opacity = '0.5';
        titleBar.classList.add('opacity-50');
      }
      wrapper.classList.remove('bg-white/60', 'backdrop-blur');
      // Remove opacity-50 from wrapper if present
      wrapper.classList.remove('opacity-50');
      btnEye.innerHTML = '✏️';
      this.enableDraggable(false);
    } else {
      textarea.style.display = '';
      renderedDiv.style.display = 'none';
      if (titleBar) {
        titleBar.style.opacity = '1';
        titleBar.classList.remove('opacity-50');
      }
      wrapper.classList.remove('opacity-50');
      wrapper.classList.add('bg-white/60', 'backdrop-blur');
      // Right arrow triangle for play/view
      btnEye.innerHTML = '▶️';
      this.enableDraggable(true);
    }
    this.element.style.border = 'none';
    this.isRendered = isView;
  }
}

export default PockitApp;