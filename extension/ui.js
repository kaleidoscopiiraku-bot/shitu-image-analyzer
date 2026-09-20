/* Shared by the native window and the browser's isolated shadow-root panel. */
(() => {
const fields=[['prompt','生图提示词'],['subject','主体'],['material','材质'],['lighting','光影'],['camera','镜头'],['composition','构图'],['style','艺术风格'],['technique','艺术技法']];
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text)x.textContent=text;return x;}
window.mountInspector=function(root,options){
 const shell=el('section','ii-shell'), head=el('header','ii-head'),badge=el('span','ii-badge','增强模型');
 head.append(el('span','ii-brand','拾图'),badge,el('span','ii-space'));
 function btn(label,fn,cls){const b=el('button',cls,label);b.type='button';b.onclick=fn;return b;}
 const tabs=el('nav','ii-tabs');tabs.setAttribute('role','tablist');
 const analysisTab=btn('分析图片',()=>switchTab('analysis'),'ii-tab');analysisTab.setAttribute('role','tab');analysisTab.setAttribute('aria-selected','true');
 const historyTab=el('button','ii-tab');historyTab.type='button';historyTab.setAttribute('role','tab');historyTab.setAttribute('aria-selected','false');
 const historyTabCount=el('span','ii-tab-count','0');historyTab.append(el('span','','最近分析'),historyTabCount);historyTab.onclick=()=>switchTab('history');tabs.append(analysisTab,historyTab);
 const native=(action,value)=>window.webkit?.messageHandlers?.native?.postMessage({action,value});
 if(options.close){head.style.cursor='grab';head.append(btn('−',()=>shell.classList.toggle('ii-collapsed'),'ii-icon'),btn('×',options.close,'ii-icon'));}
 const body=el('div','ii-body');
 if(options.native) body.classList.add('ii-native-body');
 const rail=options.native?el('aside','ii-app-rail'):null;
 let railAnalysis=null,railHistory=null,railHistoryCount=null;
 if(rail){
  const railBrand=el('div','ii-rail-brand');railBrand.append(el('strong','','拾图'),el('span','','IMAGE → PROMPT'));
  const railNav=el('nav','ii-rail-nav');
  railAnalysis=btn('⌁  图片分析',()=>switchTab('analysis'),'ii-rail-item ii-active');
  railHistory=btn('◷  最近分析',()=>switchTab('history'),'ii-rail-item');railHistoryCount=el('span','ii-rail-count','0');railHistory.append(railHistoryCount);
  railNav.append(railAnalysis,railHistory);
  const railSection=el('div','ii-rail-section');railSection.append(el('span','','最近项目'),el('span','ii-rail-hint','本机保存 10 条'));
  rail.append(railBrand,railNav,railSection,el('div','ii-rail-spacer'),el('span','ii-rail-footer','增强模型 · 本地优先'));
  body.append(rail);
 }
 const workspace=el('div','ii-workspace'),historyPanel=el('aside','ii-history ii-hidden'),historyList=el('div','ii-history-list');historyPanel.setAttribute('role','tabpanel');
 const historyHead=el('div','ii-history-head');historyHead.append(el('h2','','最近分析'),el('span','ii-history-count','0 / 10'));historyPanel.append(historyHead,historyList);
 const content=el('main','ii-main'),intro=el('div','ii-intro-wrap'),providerBar=el('section','ii-provider-bar');content.setAttribute('role','tabpanel');
 intro.append(el('h1','ii-intro','把画面，拆成创作语言。'),el('p','ii-muted','选中一张图片，拆解主体、材质、光影、镜头、构图，并分析艺术风格、字体设计与表现技法。'));
 const drop=el('div','ii-drop');drop.tabIndex=0;drop.setAttribute('role','button');drop.append(el('strong','','选择或拖入图片'),el('span','ii-muted','图片只在这台 Mac 上分析'));
 const input=el('input','ii-hidden');input.type='file';input.accept='image/*';input.onchange=()=>readFile(input.files[0]);
 drop.onclick=()=>input.click();drop.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click();}};
 for(const type of ['dragenter','dragover'])drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add('drag');});
 drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag');readFile(e.dataTransfer.files[0]);});
 intro.append(drop,input);
 if(options.native){const actions=el('div','ii-actions');actions.append(btn('框选图片  ⌃⌥I',()=>native('capture')),btn('分析剪贴板图片',()=>native('clipboard')));intro.append(actions);}
 const health=el('div','ii-health','正在连接分析模型…');intro.append(health);
 const setupCard=el('section','ii-setup ii-hidden');
 const setupTitle=el('h2','','首次设置');
 const setupLead=el('p','ii-settings-note','拾图会先读取这台 Mac 的芯片、统一内存和可用磁盘空间，再推荐适合的本地视觉模型。硬件信息只在本机判断，不会上传。');
 const setupHardware=el('div','ii-setup-detail','正在检测这台 Mac…');
 const setupRecommendation=el('div','ii-setup-recommendation','正在生成推荐…');
 const setupModelAction=btn('使用推荐模型',chooseRecommendedModel,'ii-primary');
 const setupCodex=el('div','ii-setup-codex');
 const setupCodexStatus=el('p','ii-settings-note','正在检测 Codex CLI…');
 const setupCodexLogin=btn('打开 Codex 登录',startCodexLogin,'ii-secondary');
 const setupCodexRefresh=btn('重新检测',refreshSystem,'ii-secondary');
 const setupActions=el('div','ii-key-actions'),setupDone=btn('完成首次设置',completeSetup,'ii-primary');
 setupCodex.append(setupCodexStatus,setupCodexLogin,setupCodexRefresh);
 setupActions.append(setupDone);
 setupCard.append(setupTitle,setupLead,setupHardware,setupRecommendation,setupModelAction,setupCodex,setupActions);
 const settings=el('section','ii-settings'),modeLabel=el('label','ii-setting-label','选择分析方式'),mode=el('select','ii-select');
 const adapterOption=el('option','','增强模型');adapterOption.value='mlx-adapter';
 const webOption=el('option','','ChatGPT 直连（Codex CLI）');webOption.value='chatgpt-web';mode.append(adapterOption,webOption);modeLabel.append(mode);providerBar.append(modeLabel);
 const customOption=el('option','','自定义 API（OpenAI 兼容）');customOption.value='custom-api';mode.append(customOption);
 const customPanel=el('div','ii-custom-api ii-hidden');
 const customEndpoint=el('input','ii-key');customEndpoint.type='url';customEndpoint.autocomplete='url';customEndpoint.spellcheck=false;customEndpoint.placeholder='https://api.openai.com/v1/chat/completions';
 const customEndpointLabel=el('label','ii-setting-label','API 地址（完整 Chat Completions 地址）');customEndpointLabel.append(customEndpoint);
 const customModel=el('input','ii-key');customModel.type='text';customModel.autocomplete='off';customModel.spellcheck=false;customModel.placeholder='例如：gpt-4o';
 const customModelLabel=el('label','ii-setting-label','视觉模型名称');customModelLabel.append(customModel);
 const customKey=el('input','ii-key');customKey.type='password';customKey.autocomplete='new-password';customKey.spellcheck=false;customKey.placeholder='粘贴 API Key；留空不会覆盖已保存的 Key';
 const customKeyLabel=el('label','ii-setting-label','API Key');customKeyLabel.append(customKey);
 const customKeyHint=el('p','ii-settings-note','填写支持图片输入与 JSON 输出的 OpenAI 兼容接口。');
 const customActions=el('div','ii-key-actions'),saveCustom=btn('保存 API 设置',saveCustomApi,'ii-primary'),clearCustom=btn('清除已保存的 Key',clearCustomKey);customActions.append(saveCustom,clearCustom);
 customPanel.append(customEndpointLabel,customModelLabel,customKeyLabel,customKeyHint,customActions);modeLabel.append(mode);providerBar.append(modeLabel,customPanel);
 const settingsStatus=el('p','ii-settings-status','正在读取分析设置…');
 const settingsNote=el('p','ii-settings-note','增强模型在本机运行；ChatGPT 直连通过已登录的 Codex CLI 账号分析，不需要 API Key。');
 const codexTools=el('div','ii-codex-tools ii-hidden');
 const codexAccessStatus=el('span','ii-settings-note','正在检测 Codex CLI…');
 const codexAccessLogin=btn('打开 Codex 登录',startCodexLogin,'ii-secondary');
 const codexAccessRefresh=btn('重新检测',refreshSystem,'ii-secondary');
 codexTools.append(codexAccessStatus,codexAccessLogin,codexAccessRefresh);
 settings.append(settingsStatus,settingsNote,codexTools);
 const preview=el('div','ii-preview ii-hidden'),img=el('img');img.alt='当前选中的图片';const meta=el('div'),name=el('div','ii-name'),status=el('div','ii-status');meta.append(name,status);preview.append(img,meta);
 const resultHead=el('div','ii-result-head ii-hidden');resultHead.append(el('div','ii-result-eyebrow','ANALYSIS RESULT / 02'),el('h2','','这张图，可以这样说。'),el('p','ii-muted','已按主体、材质、光影、镜头、构图与艺术语言拆解。'));
 const error=el('div','ii-error ii-hidden'),cards=el('div','ii-cards'),home=btn('← 返回图片分析',goHome,'ii-home'),retry=btn('重新分析当前图片',()=>current&&analyze(current.data,current.name,null,current.sourceUrl));home.classList.add('ii-hidden');retry.classList.add('ii-hidden');
 const chatGPTPanel=el('section','ii-chatgpt-panel ii-hidden');
 chatGPTPanel.append(el('h3','','ChatGPT 网页分析 · 手动备用'),el('p','ii-settings-note','默认使用本机已登录的 Codex CLI 直接分析；如果 CLI 不可用，可在这里复制当前图片、详细分析要求和页面链接，再手动粘贴到 ChatGPT 网页。回来后把 ChatGPT 的 JSON 回复粘贴到这里导入。'));
 const openChatGPT=btn('复制图片与详细分析要求',sendToChatGPT,'ii-primary');
 const copyWebPrompt=btn('复制分析要求和页面链接',()=>copy(chatGPTPrompt(),copyWebPrompt));
 const responseInput=el('textarea','ii-chatgpt-response');responseInput.placeholder='从 ChatGPT 复制完整回复，然后在这里按 ⌘V 粘贴';
 const importChatGPT=btn('导入为拾图分析结果',importChatGPTResult,'ii-primary');
 chatGPTPanel.append(openChatGPT,copyWebPrompt,responseInput,importChatGPT);
 content.append(providerBar,setupCard,home,intro,settings,preview,resultHead,chatGPTPanel,error,retry,cards);workspace.append(historyPanel,content);body.append(workspace);
 const foot=el('footer','ii-foot ii-hidden'),copyPrompt=btn('复制生图提示词',()=>copy(result.prompt,copyPrompt),'ii-primary'),copyAll=btn('复制全部模块',()=>copy(fields.map(([k,t])=>'【'+t+'】\n'+result[k]).join('\n\n'),copyAll));
 foot.append(copyPrompt,copyAll);shell.append(head,tabs,body,foot);
 let result=null,current=null,generation=0,timer=null,healthTimer=null,provider='mlx-adapter',historyRecords=[],activeHistoryId=null,systemSnapshot=null;
 function switchTab(name){
  const showHistory=name==='history';historyPanel.classList.toggle('ii-hidden',!showHistory);content.classList.toggle('ii-hidden',showHistory);
  analysisTab.classList.toggle('ii-active',!showHistory);historyTab.classList.toggle('ii-active',showHistory);
  analysisTab.setAttribute('aria-selected',String(!showHistory));historyTab.setAttribute('aria-selected',String(showHistory));
  if(railAnalysis){railAnalysis.classList.toggle('ii-active',!showHistory);railHistory.classList.toggle('ii-active',showHistory);}
 }
 function providerTitle(selected){return selected==='chatgpt-web'?'ChatGPT / Codex CLI':selected==='custom-api'?'自定义 API':'增强模型';}
 function renderHistory(){
  historyList.replaceChildren();historyPanel.querySelector('.ii-history-count').textContent=historyRecords.length+' / 10';historyTabCount.textContent=String(historyRecords.length);if(railHistoryCount)railHistoryCount.textContent=String(historyRecords.length);
  if(!historyRecords.length){historyList.append(el('p','ii-history-empty','完成分析后会自动保留最近 10 条。'));return;}
  for(const record of historyRecords){
   const item=btn('',()=>openHistory(record),'ii-history-item');if(record.id===activeHistoryId)item.classList.add('ii-selected');
   const when=new Date((Number(record.created)||0)*1000),source=providerTitle(record.provider);
   item.append(el('span','ii-history-title',record.name||'图片分析'),el('span','ii-history-meta',source+' · '+when.toLocaleString()));historyList.append(item);
  }
 }
 function refreshHistory(){
  options.request('/history').then(data=>{historyRecords=Array.isArray(data.history)?data.history:[];renderHistory();})
   .catch(()=>{historyList.replaceChildren(el('p','ii-history-empty','连接拾图后显示最近分析。'));});
 }
 function persistHistory(parsed,sourceProvider){
  options.request('/history',{name:current?.name||'图片分析',provider:sourceProvider,result:parsed})
   .then(data=>{historyRecords=Array.isArray(data.history)?data.history:[];renderHistory();})
   .catch(e=>showError('分析结果已生成，但保存到最近分析失败：'+e.message));
 }
 function updateModeStatus(){
  const selected=mode.value||provider;
  customPanel.classList.toggle('ii-hidden',selected!=='custom-api');
  codexTools.classList.toggle('ii-hidden',selected!=='chatgpt-web');
  badge.textContent=providerTitle(selected);
  if(selected==='chatgpt-web'){
   settingsStatus.textContent='使用本机已登录的 Codex CLI 账号直接分析图片。';
   settingsNote.textContent='不需要单独配置 OpenAI API Key；会使用已登录的 Codex CLI 账号，结果回到拾图并保存到最近分析。';
   drop.querySelector('span').textContent='图片会交给 Codex CLI 直连分析';
   if(health.textContent.startsWith('请先打开'))health.textContent='● ChatGPT / Codex CLI 就绪';
  }else if(selected==='custom-api'){
   settingsStatus.textContent='使用你配置的 OpenAI 兼容视觉 API 分析图片。';
   settingsNote.textContent='图片会发送到你填写的 API 地址；接口需支持 Chat Completions、图片输入与 JSON 输出。';
   drop.querySelector('span').textContent='图片会交给你配置的 API 分析';
   health.textContent=customKeyHint.textContent.startsWith('已保存')?'● 自定义 API · 已配置':'● 自定义 API · 请填写并保存 API 设置';
  }else{
   settingsStatus.textContent='使用 Qwen3-VL 8B 与从你的 Pinterest 设计图板训练的拾图 LoRA。';
   settingsNote.textContent='增强模型在这台 Mac 上分析，首次使用需载入模型并占用较多内存。';
   drop.querySelector('span').textContent='增强模型首次启动较慢，图片不会上传';
  }
 }
 function applySettings(s){
  const selected=['mlx-adapter','chatgpt-web','custom-api'].includes(s?.provider)?s.provider:'mlx-adapter';
  provider=selected;mode.value=selected;
  const custom=s?.custom_api;
 if(custom&&typeof custom==='object'){
   if(typeof custom.endpoint==='string')customEndpoint.value=custom.endpoint;
   if(typeof custom.model==='string')customModel.value=custom.model;
  customKey.value='';customKeyHint.textContent=custom.key_configured?'已保存 API Key；留空保存不会覆盖它。':'尚未保存 API Key。';
 }
 updateModeStatus();
  if(options.native && s && s.setup_complete===false){setupCard.classList.remove('ii-hidden');content.classList.add('ii-first-run');}
  else if(s && s.setup_complete!==false){setupCard.classList.add('ii-hidden');content.classList.remove('ii-first-run');}
 }
 function formatGb(value){return typeof value==='number'?value.toFixed(1)+' GB':'未知';}
 function renderSystem(info){
  systemSnapshot=info||null;
  const h=info?.hardware||{},r=info?.recommendation||{},m=r.model||{};
  setupHardware.textContent=`检测到：${h.architecture||'未知架构'} · ${formatGb(h.memory_gb)} 统一内存 · 可用磁盘 ${formatGb(h.free_disk_gb)} · macOS ${h.macos||'未知'}`;
  setupRecommendation.textContent=m.name?`推荐：${m.name}（${m.quality||'综合'} · ${m.speed||'均衡'}）——${r.reason||''}`:'当前没有可用的本地模型，请先选择 Codex 直连或自定义 API。';
  setupModelAction.disabled=!m.name||(!m.installed&&m.downloadable===false);
  setupModelAction.textContent=m.installed?'使用推荐模型':m.downloadable?'下载并使用推荐模型':'本地模型尚未提供下载包';
  const c=info?.codex||{};
  codexAccessStatus.textContent=c.installed?(c.authenticated?`Codex CLI 已就绪 · ${c.auth_method==='chatgpt'?'ChatGPT 账号':'已登录'}${c.version?' · '+c.version:''}`:`Codex CLI 已安装${c.version?' · '+c.version:''}，尚未登录。`):'Codex CLI：未安装。';
  codexAccessLogin.textContent=c.installed?'打开 Codex 登录':'查看 Codex 安装步骤';
  if(!c.installed){setupCodexStatus.textContent='Codex CLI：未安装。安装后可在这里重新检测。';setupCodexLogin.textContent='查看 Codex 安装步骤';}
  else if(!c.authenticated){setupCodexStatus.textContent=`Codex CLI 已安装（${c.version||'版本未知'}），尚未登录。`;setupCodexLogin.textContent='打开 Codex 登录';}
  else {setupCodexStatus.textContent=`Codex CLI 已就绪 · ${c.auth_method==='chatgpt'?'ChatGPT 账号':'已登录'}${c.version?' · '+c.version:''}`;setupCodexLogin.textContent='重新登录 Codex';}
 }
 async function refreshSystem(){
  if(!options.request)return;
  setupCodexRefresh.disabled=true;
  try{renderSystem(await options.request('/system'));}
  catch(e){setupHardware.textContent='暂时无法读取本机状态，请确认 Mac 版拾图正在运行。';setupRecommendation.textContent=e.message;}
  finally{setupCodexRefresh.disabled=false;}
 }
 function chooseRecommendedModel(){
  const m=systemSnapshot?.recommendation?.model;
  if(!m)return;
  mode.value='mlx-adapter';updateModeStatus();settingsStatus.textContent=m.installed?'已选择推荐本地模型。':'已选择本地模型；下载包准备好后可在这里继续下载。';
 }
 function startCodexLogin(){
  if(options.native){native('codex-login');return;}
  setupCodexStatus.textContent='请在 Mac 版拾图中完成 Codex 登录。';codexAccessStatus.textContent='请在 Mac 版拾图中完成 Codex 登录。';
 }
 async function completeSetup(){
  setupDone.disabled=true;
  try{applySettings(await options.request('/setup',{provider:mode.value||provider}));setupCard.classList.add('ii-hidden');content.classList.remove('ii-first-run');settingsStatus.textContent='首次设置已完成，之后可在这里切换分析方式。';}
  catch(e){setupRecommendation.textContent='保存失败：'+e.message;}
  finally{setupDone.disabled=false;}
 }
 async function saveCustomApi(){
  saveCustom.disabled=true;clearCustom.disabled=true;settingsStatus.textContent='正在保存自定义 API 设置…';
  try{
   const saved=await options.request('/settings',{provider:'custom-api',custom_api:{endpoint:customEndpoint.value,model:customModel.value,api_key:customKey.value}});
   applySettings(saved);settingsStatus.textContent='自定义 API 设置已保存。';
  }catch(e){settingsStatus.textContent='保存失败：'+e.message;showError('自定义 API 设置未保存：'+e.message);}
  finally{saveCustom.disabled=false;clearCustom.disabled=false;}
 }
 async function clearCustomKey(){
  clearCustom.disabled=true;saveCustom.disabled=true;settingsStatus.textContent='正在清除 API Key…';
  try{
   const saved=await options.request('/settings',{provider:'custom-api',custom_api:{clear_key:true}});
   applySettings(saved);settingsStatus.textContent='已清除保存的 API Key。';
  }catch(e){settingsStatus.textContent='清除失败：'+e.message;showError('无法清除 API Key：'+e.message);}
  finally{clearCustom.disabled=false;saveCustom.disabled=false;}
 }
 mode.onchange=async()=>{
  const next=mode.value,previous=provider;mode.disabled=true;settingsStatus.textContent='正在保存分析方式…';
  try{applySettings(await options.request('/settings',{provider:next}));if(current)analyze(current.data,current.name,next,current.sourceUrl);}
  catch(e){mode.value=previous;updateModeStatus();settingsStatus.textContent='设置未保存：'+e.message;}
  finally{mode.disabled=false;}
 };
 async function copy(text,b){try{if(options.native)native('copy',text);else if(options.copy)await options.copy(text);else {try{await navigator.clipboard.writeText(text);}catch{const t=el('textarea');t.value=text;root.append(t);t.select();if(!document.execCommand('copy'))throw Error('请选中文字手动复制。');t.remove();}}const old=b.textContent;b.textContent='已复制';setTimeout(()=>b.textContent=old,1200);}catch(e){showError('复制失败：'+e.message);}}
 function showError(text){switchTab('analysis');error.textContent=text;error.classList.remove('ii-hidden');}
 async function readFile(file){if(!file)return;try{if(file.size>40*1024*1024)throw Error('文件超过40MB，请先缩小。');const url=URL.createObjectURL(file);try{await analyze(await normalize(url),file.name);}finally{URL.revokeObjectURL(url);}}catch(e){showError(e.message);}}
 async function normalize(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const scale=Math.min(1,1280/Math.max(image.width,image.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(image.width*scale));c.height=Math.max(1,Math.round(image.height*scale));const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(image,0,0,c.width,c.height);try{resolve(c.toDataURL('image/jpeg',.9));}catch(e){reject(e);}};image.onerror=()=>reject(Error('无法读取这张图片。HEIC等格式可以从本地工具的“打开图片”导入。'));image.src=src;});}
 function goHome(){generation++;clearInterval(timer);result=null;current=null;activeHistoryId=null;switchTab('analysis');renderHistory();cards.replaceChildren();responseInput.value='';chatGPTPanel.classList.add('ii-hidden');intro.classList.remove('ii-hidden');preview.classList.add('ii-hidden');resultHead.classList.add('ii-hidden');error.classList.add('ii-hidden');home.classList.add('ii-hidden');retry.classList.add('ii-hidden');foot.classList.add('ii-hidden');}
 function sourceLink(value){const url=typeof value==='string'?value.trim():'';return /^https?:\/\//i.test(url)?url:'';}
 function chatGPTPrompt(){const source=sourceLink(current?.sourceUrl),sourceNote=source?`\n\n当前图片所在页面链接（仅作来源参考，不要根据网页文字补充图片中不可见的内容）：${source}`:'';return `请只分析我附带的这一张图片，不要补充画面中没有的内容。请用简体中文具体描述可见证据；镜头焦段、光圈、相机型号和确切机位不能单凭图片确认，不确定时要写“推测”，不要编造成事实。${sourceNote}\n\n请严格只输出一个 JSON 对象，不要 Markdown 代码块或额外说明。字段名必须完全一致，字段值都用字符串：\n- subject：主体的外形、动作/姿态、视线、位置和显著特征。\n- material：主体与环境可见的材质、表面纹理及其依据。\n- lighting：光线方向、软硬、明暗关系、色温和阴影。\n- camera：景别、清晰范围、背景虚化和可见透视；焦段等无法确认时标为推测。\n- composition：先写画面比例和横竖方向，例如横版约16:9、竖版约3:4或正方形；再写主体位置、画面层次、留白、引导线和裁切关系。比例仅按画面边界目测，不能编造像素尺寸。\n- style：具体艺术风格及可见视觉依据。画面有文字时，还要分析字体设计与排版：字形倾向、字重、大小层级、字距、颜色、排列方向，以及文字如何参与画面的节奏或品牌感；看不清时不要臆测。\n- technique：具体表现技法，如笔触、颗粒、晕染、描边、渲染或材质处理；没有充分依据时说明不确定。\n- prompt：整合主体动作、场景、画面比例与构图、颜色光线、材质、艺术风格、字体排版与技法，写成一段具体、可直接用于生图的中文提示词。\n\nJSON 字段名：subject、material、lighting、camera、composition、style、technique、prompt`}
 function openHistory(record){
  generation++;clearInterval(timer);switchTab('analysis');current=null;activeHistoryId=record.id;result=null;intro.classList.add('ii-hidden');preview.classList.add('ii-hidden');chatGPTPanel.classList.add('ii-hidden');error.classList.add('ii-hidden');responseInput.value='';
  mode.value=['mlx-adapter','chatgpt-web','custom-api'].includes(record.provider)?record.provider:'mlx-adapter';updateModeStatus();
  const when=new Date((Number(record.created)||0)*1000).toLocaleString();
  showResult(record.result,'历史记录 · '+when+' · 原图未保存',record.provider,false);
 }
 function showResult(parsed,statusText,sourceProvider=mode.value||provider,save=true){
  switchTab('analysis');result=parsed;cards.replaceChildren();status.textContent=statusText;resultHead.classList.remove('ii-hidden');
  for(const [key,title]of fields){const card=el('article','ii-card'+(key==='prompt'?' ii-prompt':'')),ch=el('div','ii-card-head');const copyButton=btn('复制',()=>copy(result[key],copyButton));ch.append(el('h3','',title),copyButton);card.append(ch,el('p','',result[key]));cards.append(card);}
  foot.classList.remove('ii-hidden');home.classList.remove('ii-hidden');retry.classList.toggle('ii-hidden',!current);renderHistory();
  if(save)persistHistory(parsed,sourceProvider);
 }
 async function sendToChatGPT(){
  if(!current)return;
  openChatGPT.disabled=true;openChatGPT.textContent='正在准备图片…';error.classList.add('ii-hidden');
  try{
   let outcome={};
   if(options.native)native('chatgpt-web',{image:current.data,prompt:chatGPTPrompt()});
   else if(options.prepareChatGPT)outcome=await options.prepareChatGPT(current.data,chatGPTPrompt())||{};
   else throw Error('当前入口无法写入图片剪贴板，请手动上传图片并复制分析要求。');
   const copiedLabel=current?.sourceUrl?'图片、详细分析要求和当前页面链接':'图片和详细分析要求';
   status.textContent=outcome.warning||copiedLabel+'已准备到剪贴板。请切到 ChatGPT 输入框按 ⌘V，然后发送。';
   openChatGPT.textContent=outcome.warning?'已复制部分内容 · 请手动上传图片':'已复制 · 可再次复制';
  }catch(e){showError('准备 ChatGPT 图片失败：'+e.message);openChatGPT.textContent='重试：复制图片与详细分析要求';}
  finally{openChatGPT.disabled=false;}
 }
 function importChatGPTResult(){
  try{
   let text=responseInput.value.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
   const start=text.indexOf('{'),end=text.lastIndexOf('}');if(start<0||end<start)throw Error('没有找到 JSON。请复制 ChatGPT 的完整回复；如果它用了普通段落，请让它按拾图要求输出 JSON。');
   const source=JSON.parse(text.slice(start,end+1)),aliases={subject:['subject','主体'],material:['material','材质'],lighting:['lighting','光影'],camera:['camera','镜头'],composition:['composition','构图'],style:['style','艺术风格'],technique:['technique','艺术技法'],prompt:['prompt','生图提示词']},parsed={};
   for(const [key] of fields){const value=aliases[key].map(k=>source[k]).find(v=>typeof v==='string'&&v.trim());if(!value)throw Error(`回复缺少“${fields.find(([k])=>k===key)[1]}”字段。`);parsed[key]=value.trim();}
   chatGPTPanel.classList.remove('ii-hidden');showResult(parsed,'已导入 ChatGPT 网页分析结果 · 未使用 API','chatgpt-web');
  }catch(e){showError('无法导入 ChatGPT 回复：'+e.message);}
 }
 async function analyze(data,label='所选图片',providerOverride=null,sourceUrl=''){
  switchTab('analysis');const run=++generation,runProvider=providerOverride||mode.value||provider;mode.value=runProvider;updateModeStatus();clearInterval(timer);result=null;activeHistoryId=null;current={data,name:label,sourceUrl:sourceLink(sourceUrl)};error.classList.add('ii-hidden');home.classList.add('ii-hidden');retry.classList.add('ii-hidden');cards.replaceChildren();foot.classList.add('ii-hidden');chatGPTPanel.classList.add('ii-hidden');intro.classList.add('ii-hidden');preview.classList.remove('ii-hidden');resultHead.classList.add('ii-hidden');img.src=data;name.textContent=label;
  const start=Date.now();function progress(){status.replaceChildren(el('span','ii-loading'),document.createTextNode('正在'+providerTitle(runProvider)+'分析 · '+Math.floor((Date.now()-start)/1000)+' 秒'));}progress();timer=setInterval(progress,1000);
  try{
   const normalized=await normalize(data);if(run!==generation)return;
   current={data:normalized,name:label,sourceUrl:sourceLink(current.sourceUrl)};img.src=normalized;
   const job=await options.request('/jobs',{image:normalized.split(',')[1],provider:runProvider,source_url:current.sourceUrl||''});
   for(let i=0;i<600;i++){
    await new Promise(r=>setTimeout(r,1000));if(run!==generation)return;
    const state=await options.request('/jobs/'+job.id);
    if(state.status==='error')throw Error(state.error);
    if(state.status==='done'){
     const parsed=state.result;clearInterval(timer);
     const missing=fields.filter(([key])=>typeof parsed?.[key]!=='string'||!parsed[key].trim()).map(([,title])=>title);
     if(missing.length)throw Error(`分析结果缺少“${missing.join('、')}”，可能仍连接着旧版分析服务。请退出并重新打开拾图后重试。`);
     const label=runProvider==='mlx-adapter'?'增强模型 · Pinterest LoRA':providerTitle(runProvider);
     showResult(parsed,'完成 · '+state.seconds+' 秒 · '+label,runProvider);return;
    }
   }throw Error('分析超时。请稍后重试，或关闭占用内存较大的软件。');
  }catch(e){if(run===generation){clearInterval(timer);status.textContent='本次分析未完成';if(runProvider==='chatgpt-web')chatGPTPanel.classList.remove('ii-hidden');showError(e.message);home.classList.remove('ii-hidden');retry.classList.remove('ii-hidden');}}
 }
 function checkHealth(){
  clearTimeout(healthTimer);
  if(mode.value==='chatgpt-web'){health.textContent='● ChatGPT / Codex CLI · 使用已登录账号';return;}
  if(mode.value==='custom-api'){health.textContent=customKeyHint.textContent.startsWith('已保存')?'● 自定义 API · 已配置':'● 自定义 API · 请填写并保存 API 设置';return;}
  options.request('/health').then(s=>{
   applySettings(s);
   if(mode.value==='chatgpt-web'){health.textContent='● ChatGPT / Codex CLI · 使用已登录账号';return;}
   if(mode.value==='custom-api'){health.textContent=customKeyHint.textContent.startsWith('已保存')?'● 自定义 API · 已配置':'● 自定义 API · 请填写并保存 API 设置';return;}
   health.textContent=!s.ready?(s.error||'增强模型文件未就绪'):s.running?'● 增强模型运行中 · Qwen3-VL 8B + LoRA':'● 增强模型就绪 · 首次使用时载入';
   if(!s.ready)healthTimer=setTimeout(checkHealth,5000);
  }).catch(()=>{if(mode.value==='chatgpt-web'){health.textContent='● ChatGPT / Codex CLI · 使用已登录账号';return;}if(mode.value==='custom-api'){health.textContent='● 自定义 API · 请填写并保存 API 设置';return;}health.textContent='请先打开 Mac 上的“拾图”工具。';healthTimer=setTimeout(checkHealth,5000);});
 }
 root.append(shell);
 refreshHistory();
 checkHealth();
 if(options.native) refreshSystem();
 return {analyze,showError,openChatGPT:sendToChatGPT,head,destroy(){generation++;clearInterval(timer);clearTimeout(healthTimer);shell.remove();}};
};
})();
