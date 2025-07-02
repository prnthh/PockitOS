// Modal component: renders a fixed, centered modal with custom content and a close button
class Modal {
  constructor({ content = '', onClose = null } = {}) {
    this.content = content;
    this.onClose = typeof onClose === 'function' ? onClose : null;
    this.element = this.createModal();
    document.body.appendChild(this.element);
  }

  createModal() {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.3)';
    overlay.style.zIndex = 1000000;
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const modal = document.createElement('div');
    modal.className = 'pockit-modal bg-white rounded shadow-lg p-6 max-w-md w-full relative';
    modal.style.position = 'relative';
    modal.style.boxShadow = '0 4px 32px rgba(0,0,0,0.18)';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '12px';
    closeBtn.style.right = '16px';
    closeBtn.style.fontSize = '1.5rem';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => this.close();

    const contentDiv = document.createElement('div');
    if (typeof this.content === 'string') {
      contentDiv.innerHTML = this.content;
    } else if (this.content instanceof Node) {
      contentDiv.appendChild(this.content);
    }

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
