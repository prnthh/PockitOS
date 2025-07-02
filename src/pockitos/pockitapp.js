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
    this.q('textarea').addEventListener('input', () => this.onContentChange?.());
  }

  createUI(state = null) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pockit-os-window fixed bg-white min-w-[300px] min-h-[150px]';
    wrapper.style.cssText = 'z-index:1000;position:absolute;border:none;';
    const idToShow = this.id;
    wrapper.innerHTML = `
      <div class="title-bar flex items-center justify-between px-3 py-2 bg-gray-800 cursor-move select-none" style="border-radius:0;padding:0;opacity:1;">
        <span class='text-xs text-gray-300 ml-2 pockit-id-span'>[${idToShow}]</span>
        <div class="buttons flex">
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
    if (isView) {
      this._injectedModuleScripts?.forEach(s => s.remove());
      this._injectedModuleScripts = [];
      renderedDiv.innerHTML = '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = textarea.value;
      tempDiv.querySelectorAll('script[type="module"]').forEach(script => {
        const newScript = document.createElement('script');
        newScript.type = 'module';
        newScript.textContent = script.textContent;
        document.body.appendChild(newScript);
        (this._injectedModuleScripts ||= []).push(newScript);
        script.remove();
      });
      const importmapScript = tempDiv.querySelector('script[type="importmap"]');
      if (importmapScript && !document.querySelector('script[type="importmap"][data-pockit]')) {
        const newImportmap = document.createElement('script');
        newImportmap.type = 'importmap';
        newImportmap.setAttribute('data-pockit', 'true');
        newImportmap.textContent = importmapScript.textContent;
        document.head.appendChild(newImportmap);
        importmapScript.remove();
      }
      while (tempDiv.firstChild) renderedDiv.appendChild(tempDiv.firstChild);
      textarea.style.display = 'none';
      renderedDiv.style.display = '';
      btnEye.textContent = '\u270f\ufe0f';
      this.element.style.border = 'none';
      if (titleBar) titleBar.style.opacity = '0.5';
    } else {
      this._injectedModuleScripts?.forEach(s => s.remove());
      this._injectedModuleScripts = [];
      textarea.style.display = '';
      renderedDiv.style.display = 'none';
      btnEye.textContent = '\ud83d\udc41\ufe0f';
      this.element.style.border = 'none';
      if (titleBar) titleBar.style.opacity = '1';
    }
  }
}

export default PockitApp;