// AI Modal Plugin for PockitOS
function $(parent, sel) { return parent.querySelector(sel); }

async function pingEndpoint(input, settingsDiv) {
  try {
    const resp = await fetch(input.value, { method: 'OPTIONS' });
    input.style.borderColor = resp.ok ? '' : 'red';
    if (!resp.ok) settingsDiv.style.display = '';
  } catch {
    input.style.borderColor = 'red';
    settingsDiv.style.display = '';
  }
}

async function fetchModels(endpoint, apiKey) {
  // Always use the base URL for /v1/models
  let url = 'http://localhost:11434/v1/models';
  const res = await fetch(url, {
    headers: {
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
    }
  });
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = await res.json();
  return data.data ? data.data.map(m => m.id) : [];
}

async function rewriteContent({ endpoint, apiKey, instruction, content, model }) {
  const url = 'http://localhost:11434/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
  };
  const body = JSON.stringify({
    model: model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant. The user will provide some content and a rewrite instruction. Rewrite the content as per the instruction.' },
      { role: 'user', content: `Content to rewrite:\n${content}\n\nInstruction: ${instruction}` }
    ]
  });
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body
  });
  return res.json();
}

export function aiModalPlugin(app) {
  const modal = new Modal({
    content: `
      <div class="flex flex-col gap-2 w-full md:w-[600px] max-w-full">
        <div id="pockit-ai-result" class="mb-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm whitespace-pre-wrap min-h-[2em]"></div>
        <div class="flex gap-2">
          <input id="pockit-ai-instruction" type="text" placeholder="Rewrite instructions (e.g. 'Rewrite this as a poem')" class="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <button id="pockit-ai-rewrite" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Rewrite</button>
          <button id="pockit-ai-settings-toggle" class="px-2 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition" title="Show API settings">⚙️</button>
        </div>
        <div id="pockit-ai-settings" style="display:none;" class="flex flex-col gap-2 mt-2">
          <input id="pockit-ai-endpoint" type="text" value="http://localhost:11434/v1/chat/completions" placeholder="OpenAI Compatible Endpoint URL (e.g. http://localhost:11434/v1/chat/completions)" class="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input id="pockit-ai-key" type="text" placeholder="API Key (optional)" class="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <select id="pockit-ai-model" class="rounded border border-gray-300 px-2 py-2 text-sm"></select>
        </div>
      </div>
    `
  });
  const endpointInput = $(modal.content, '#pockit-ai-endpoint');
  const keyInput = $(modal.content, '#pockit-ai-key');
  const instructionInput = $(modal.content, '#pockit-ai-instruction');
  const modelSelect = $(modal.content, '#pockit-ai-model');
  const rewriteBtn = $(modal.content, '#pockit-ai-rewrite');
  const resultDiv = $(modal.content, '#pockit-ai-result');
  const settingsDiv = $(modal.content, '#pockit-ai-settings');
  const settingsToggle = $(modal.content, '#pockit-ai-settings-toggle');

  resultDiv.textContent = app.getContent ? app.getContent() : '';

  const handlePing = () => pingEndpoint(endpointInput, settingsDiv);
  handlePing();
  endpointInput.addEventListener('input', handlePing);

  async function loadModels() {
    modelSelect.innerHTML = '<option>Loading...</option>';
    try {
      const models = await fetchModels(endpointInput.value, keyInput.value);
      modelSelect.innerHTML = '';
      models.forEach((m, i) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        modelSelect.appendChild(opt);
      });
      if (models.length === 0) modelSelect.innerHTML = '<option>No models</option>';
      else modelSelect.value = models[0]; // Set default to first model
    } catch {
      modelSelect.innerHTML = '<option>Error loading models</option>';
    }
  }
  keyInput.addEventListener('change', loadModels);
  endpointInput.addEventListener('change', loadModels);
  loadModels();

  async function handleRewrite() {
    resultDiv.textContent = 'Thinking...';
    try {
      const data = await rewriteContent({
        endpoint: endpointInput.value,
        apiKey: keyInput.value,
        instruction: instructionInput.value,
        content: app.getContent ? app.getContent() : '',
        model: modelSelect.value
      });
      const aiText = data?.choices?.[0]?.message?.content || data.result || data.text || 'No response';
      resultDiv.textContent = aiText;
      if (aiText) app.setContent(aiText);
    } catch {
      resultDiv.textContent = 'Error contacting AI.';
    }
  }
  rewriteBtn.onclick = handleRewrite;
  instructionInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRewrite();
    }
  });
  settingsToggle.onclick = () => {
    settingsDiv.style.display = settingsDiv.style.display === 'none' ? '' : 'none';
  };
}
