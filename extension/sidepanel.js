(() => {
  const root = document.getElementById('inspector');
  let currentTabId = null;
  let view = null;
  const queued = [];
  function request(path, body) {
    return chrome.runtime.sendMessage({type:'shitu-api', path, body}).then(response => {
      if (response?.error) throw Error(response.error);
      if (!response?.data) throw Error('本地服务没有响应。');
      return response.data;
    });
  }
  async function prepareChatGPT(imageData, prompt) {
    let copiedImage = false, copiedPrompt = false;
    async function copyPrompt() {
      try { await navigator.clipboard.writeText(prompt); return true; } catch {}
      try {
        const textarea = document.createElement('textarea');
        textarea.value = prompt;
        textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.append(textarea); textarea.focus(); textarea.select();
        const ok = document.execCommand('copy'); textarea.remove();
        return ok;
      } catch { return false; }
    }
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw Error('当前浏览器不支持图片剪贴板');
      const png = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
            canvas.getContext('2d').drawImage(image, 0, 0);
            canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('图片转换失败')), 'image/png');
          } catch (e) { reject(e); }
        };
        image.onerror = () => reject(Error('图片转换失败'));
        image.src = imageData;
      });
      await navigator.clipboard.write([new ClipboardItem({
        'text/plain': new Blob([prompt], {type:'text/plain'}),
        'image/png': png
      })]);
      copiedImage = true; copiedPrompt = true;
    } catch {
      copiedPrompt = await copyPrompt();
    }
    return copiedImage && copiedPrompt ? {} : {
      warning: copiedPrompt
        ? '已复制分析要求；浏览器没有复制图片，请在 ChatGPT 中手动上传刚才选中的图片。'
        : '图片和分析要求未能自动复制，请手动上传图片并从拾图重新复制分析要求。'
    };
  }
  async function activeTabId() {
    const tabs = await chrome.tabs.query({active:true, lastFocusedWindow:true});
    return tabs[0]?.id ?? null;
  }
  function handle(message) {
    if (message?.tabId != null && currentTabId == null) { queued.push(message); return true; }
    if (!message || (message.tabId != null && message.tabId !== currentTabId)) return false;
    if (message.type === 'shitu-sidepanel-analyze') {
      view?.analyze(message.image, message.name, message.provider, message.pageUrl);
      return true;
    }
    if (message.type === 'shitu-sidepanel-error') { view?.showError(message.error); return true; }
    return false;
  }
  view = mountInspector(root, {prepareChatGPT, request});
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (handle(message)) reply({ok:true});
  });
  activeTabId().then(tabId => {
    currentTabId = tabId;
    while (queued.length) handle(queued.shift());
    return chrome.runtime.sendMessage({type:'shitu-sidepanel-ready', tabId});
  }).then(response => { if (response?.payload) handle(response.payload); }).catch(() => {});
})();
