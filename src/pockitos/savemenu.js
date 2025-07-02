// SaveMenu component for Save/Load (debug) modal
import Modal from './modal.js';

function getDebugWindowContent() {
  return `
    <div style="font-size:12px;font-weight:bold;margin-bottom:4px;">PockitOS Memory</div>
    <textarea id="pockit-debug-textarea" style="width:100%;height:180px;font-size:11px;font-family:monospace;" class="mb-0"></textarea>
    <div style="margin-top:4px;">
      <button id="pockit-restoreall-btn" style="font-size:11px;padding:2px 8px;border:1px solid #bbb;background:#f3f3f3;cursor:pointer;">Load</button>
      <button id="pockit-save-btn" style="font-size:11px;padding:2px 8px;border:1px solid #bbb;background:#e3f3e3;cursor:pointer;margin-left:8px;">Save</button>
      <button id="pockit-viewraw-btn" style="font-size:11px;padding:2px 8px;border:1px solid #bbb;background:#e3e3f3;cursor:pointer;margin-left:8px;">View Raw</button>
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
      const textarea = document.getElementById('pockit-debug-textarea');
      textarea.style.display = 'none';
      textarea.value = this.PockitOS.memory.map(state => {
        return `<div style=\"left:${state.left};top:${state.top};z-index:${state.zIndex};position:absolute;\" id=\"${state.id || ''}\">${state.value}</div>`;
      }).join('\n\n');
      // File input for loading HTML
      let fileInput = document.getElementById('pockit-load-file-input');
      if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.html,text/html';
        fileInput.style.display = 'none';
        fileInput.id = 'pockit-load-file-input';
        document.body.appendChild(fileInput);
      }
      document.getElementById('pockit-restoreall-btn').onclick = () => {
        fileInput.value = '';
        fileInput.click();
      };
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const html = ev.target.result;
          // Extract content inside <body>...</body>
          const match = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
          if (match && match[1]) {
            textarea.value = match[1].trim();
            // Trigger input event to restore
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        };
        reader.readAsText(file);
      };
      // Save button unchanged
      document.getElementById('pockit-save-btn').onclick = () => {
        const content = textarea.value;
        const html = `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"UTF-8\">\n  <title>PockitOS Memory Dump</title>\n  <style>body{background:#fafafa;margin:24px;}div{margin-bottom:8px;}</style>\n  <script src=\"https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4\"></script>\n</head>\n<body>\n${content}\n</body>\n</html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pockitos-memory.html';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
        }, 100);
      };
      // View Raw button toggle
      const viewRawBtn = document.getElementById('pockit-viewraw-btn');
      let rawVisible = false; // Hidden by default
      viewRawBtn.textContent = 'View Raw';
      viewRawBtn.onclick = () => {
        rawVisible = !rawVisible;
        textarea.style.display = rawVisible ? '' : 'none';
        viewRawBtn.textContent = rawVisible ? 'Hide Raw' : 'View Raw';
      };
      // Restore on textarea change
      textarea.addEventListener('input', () => {
        this.PockitOS.restoreAll(undefined, textarea.value);
      });
    }, 0);
  }
}
