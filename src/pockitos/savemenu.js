// SaveMenu component for Save/Load (debug) modal
import Modal from './modal.js';

function getDebugWindowContent() {
  return `
    <div style="font-size:12px;font-weight:bold;margin-bottom:4px;">PockitOS Memory</div>
    <textarea id="pockit-debug-textarea" style="width:320px;height:180px;font-size:11px;font-family:monospace;" class="mb-0"></textarea>
    <div style="margin-top:4px;">
      <button id="pockit-restoreall-btn" style="font-size:11px;padding:2px 8px;border:1px solid #bbb;background:#f3f3f3;cursor:pointer;">Load</button>
    </div>
  `;
}

export default class SaveMenu {
  constructor(PockitOS) {
    this.PockitOS = PockitOS;
  }

  show() {
    const modal = new Modal({
      content: getDebugWindowContent(),
      onClose: () => {}
    });
    setTimeout(() => {
      document.getElementById('pockit-debug-textarea').value = this.PockitOS.memory.map(state => {
        return `<div style=\"left:${state.left};top:${state.top};z-index:${state.zIndex};position:absolute;\" id=\"${state.id || ''}\">${state.value}</div>`;
      }).join('\n\n');
      document.getElementById('pockit-restoreall-btn').onclick = () => {
        this.PockitOS.restoreAll();
        modal.close();
      };
    }, 0);
  }
}
