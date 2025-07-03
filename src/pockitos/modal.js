// Modal component: renders a fixed, centered modal with custom content and a close button
class Modal {
  constructor({ content = '', onClose = null } = {}) {
    this.content = null; // Will be set to contentDiv DOM node
    this.onClose = typeof onClose === 'function' ? onClose : null;
    this.element = this.createModal(content);
    document.body.appendChild(this.element);
  }

  createModal(content) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 w-screen h-screen bg-black/30 z-[1000000] flex items-center justify-center';

    const modal = document.createElement('div');
    modal.className = 'pockit-modal bg-white border border-black min-w-0 md:min-w-[600px] max-w-[95vw] relative flex p-6 shadow-[0_4px_32px_rgba(0,0,0,0.18)]';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.className = 'absolute top-0 right-[10px] text-[1.5rem] bg-none border-none cursor-pointer';
    closeBtn.onclick = () => this.close();

    const contentDiv = document.createElement('div');
    contentDiv.className = 'w-full flex flex-col';
    if (typeof content === 'string') {
      contentDiv.innerHTML = content;
    } else if (content instanceof Node) {
      contentDiv.appendChild(content);
    }
    this.content = contentDiv; // Expose the DOM node

    modal.appendChild(closeBtn);
    modal.appendChild(contentDiv);
    overlay.appendChild(modal);
    overlay.onclick = (e) => {
      if (e.target === overlay) this.close();
    };
    return overlay;
  }

  close() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    if (this.onClose) this.onClose();
  }
}

export default Modal;
