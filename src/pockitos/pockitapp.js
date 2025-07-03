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
    // Add all plugin buttons if plugins are loaded
    if (window.PockitOS && Array.isArray(window.PockitOS._plugins)) this.addPluginButtons();
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
    wrapper.innerHTML = `
      <div class="title-bar flex items-center justify-between px-3 py-2 bg-gray-800 cursor-move select-none" style="border-radius:0;padding:0;opacity:1;">
        <span class='text-xs text-gray-300 ml-2 pockit-id-span'>[${idToShow}]</span>
        <div class="buttons flex">
          ${pluginBtnHtml}
          <button class="btn-add w-6 h-6 flex items-center justify-center bg-green-500 hover:bg-green-600 transition" style="border-radius:0;">+</button>
          <button class="btn-eye w-6 h-6 flex items-center justify-center bg-blue-500 hover:bg-blue-600 transition" style="border-radius:0;">👁️</button>
          <button class="btn-close w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 transition" style="border-radius:0;">🗑️</button>
        </div>
      </div>
      <div class="content text-gray-800" style="padding:0;">
        <textarea class="w-full h-32 border border-gray-300 mb-0" placeholder="Type here...">${state?.value||''}</textarea>
        <div class="rendered-content w-full min-h-32 p-[1px]" style="display:none;white-space:pre-wrap;"></div>
      </div>
    `;
    this.attachIdEditHandler(wrapper.querySelector('.pockit-id-span'));
    wrapper.querySelector('.btn-close').onclick = () => { wrapper.remove(); this.onClose?.(); };
    wrapper.querySelector('.btn-add').onclick = () => this.onAdd?.();
    let isRendered = false;
    wrapper.querySelector('.btn-eye').onclick = () => { this.setViewMode(!isRendered); isRendered = !isRendered; };
    wrapper.querySelector('textarea').addEventListener('input', () => { if (isRendered) this.setViewMode(true); });
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
    // Mouse events
    bar.addEventListener('mousedown', e => {
      isDragging = true;
      const rect = el.getBoundingClientRect(), cRect = this.container.getBoundingClientRect();
      el.style.left = `${rect.left - cRect.left}px`;
      el.style.top = `${rect.top - cRect.top}px`;
      el.style.transform = '';
      offsetX = e.clientX - (rect.left - cRect.left);
      offsetY = e.clientY - (rect.top - cRect.top);
      this.onFocus?.();
      const onMove = e => {
        if (!isDragging) return;
        const cRect = this.container.getBoundingClientRect();
        el.style.left = `${e.clientX - cRect.left - offsetX}px`;
        el.style.top = `${e.clientY - cRect.top - offsetY}px`;
        this.onMove?.();
      };
      const onUp = () => { isDragging = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    // Touch events for mobile
    bar.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      const touch = e.touches[0];
      const rect = el.getBoundingClientRect(), cRect = this.container.getBoundingClientRect();
      el.style.left = `${rect.left - cRect.left}px`;
      el.style.top = `${rect.top - cRect.top}px`;
      el.style.transform = '';
      offsetX = touch.clientX - (rect.left - cRect.left);
      offsetY = touch.clientY - (rect.top - cRect.top);
      this.onFocus?.();
      const onTouchMove = e => {
        if (!isDragging || e.touches.length !== 1) return;
        const touch = e.touches[0];
        const cRect = this.container.getBoundingClientRect();
        el.style.left = `${touch.clientX - cRect.left - offsetX}px`;
        el.style.top = `${touch.clientY - cRect.top - offsetY}px`;
        this.onMove?.();
      };
      const onTouchEnd = () => { isDragging = false; document.removeEventListener('touchmove', onTouchMove); document.removeEventListener('touchend', onTouchEnd); };
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    });
  }

  q(sel) { return this.element.querySelector(sel); }

  getContent() { return this.q('textarea')?.value || ''; }
  setContent(content) { if (this.q('textarea')) this.q('textarea').value = content; }
  getState() { return { left: this.element.style.left, top: this.element.style.top, zIndex: this.element.style.zIndex, value: this.getContent(), id: this.id }; }
  setZIndex(z) { this.element.style.zIndex = z; }

  setId(newId) {
    if (!newId) return;
    this.id = newId;
    this.element.id = this.id;
    const idSpan = this.q('.pockit-id-span');
    if (idSpan) idSpan.textContent = `[${this.id}]`;
    this.onContentChange?.();
  }

  setViewMode(isView) {
    const btnEye = this.q('.btn-eye'), textarea = this.q('textarea'), renderedDiv = this.q('.rendered-content'), titleBar = this.q('.title-bar');
    if (!btnEye) return;
    const wrapper = this.element;
    // Always remove previously injected scripts
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
      if (titleBar) titleBar.style.opacity = '0.5';
      wrapper.classList.remove('bg-white/60', 'backdrop-blur');
    } else {
      textarea.style.display = '';
      renderedDiv.style.display = 'none';
      if (titleBar) titleBar.style.opacity = '1';
      wrapper.classList.add('bg-white/60', 'backdrop-blur');
    }
    btnEye.textContent = '👁️';
    this.element.style.border = 'none';
  }
}

export default PockitApp;