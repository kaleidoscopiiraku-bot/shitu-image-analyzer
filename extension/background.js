importScripts('config.js');
const BASE='http://127.0.0.1:19428';
const pendingSidePanels=new Map();
function registerContextMenus(){chrome.contextMenus.removeAll(()=>{
 if(chrome.runtime.lastError)return;
 chrome.contextMenus.create({id:'shitu-image-mlx',title:'用增强模型分析这张图',contexts:['image']});
 chrome.contextMenus.create({id:'shitu-image-chatgpt-web',title:'用 ChatGPT 直连分析这张图',contexts:['image']});
});}
function configureSidePanel(){if(chrome.sidePanel?.setPanelBehavior)chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true}).catch(()=>{});}
chrome.runtime.onInstalled.addListener(registerContextMenus);
chrome.runtime.onStartup.addListener(registerContextMenus);
chrome.runtime.onInstalled.addListener(configureSidePanel);
chrome.runtime.onStartup.addListener(configureSidePanel);
configureSidePanel();
async function api(path,body){
 let r;try{r=await fetch(BASE+path,{method:body?'POST':'GET',headers:{'Authorization':'Bearer '+SHITU_TOKEN,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});}catch{throw Error('请先打开 Mac 上的“拾图”，再点击重新分析。');}
 const j=await r.json();if(!r.ok)throw Error(j.error||'本地服务连接失败');return j;
}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(sender.id!==chrome.runtime.id)return;
 if(m.type==='shitu-sidepanel-ready'){
  const pending=pendingSidePanels.get(m.tabId);
  if(pending)pendingSidePanels.delete(m.tabId);
  reply({payload:pending||null});return;
 }
 if(m.type==='shitu-api' && (m.path==='/health'||m.path==='/system'||m.path==='/setup'||m.path==='/jobs'||m.path==='/settings'||m.path==='/history'||/^\/jobs\/[a-f0-9]{32}$/.test(m.path))){
  api(m.path,m.body).then(data=>reply({data})).catch(e=>reply({error:e.message}));return true;
 }
});
async function send(tab,frame,message){return chrome.tabs.sendMessage(tab,message,{frameId:frame});}
async function dataURL(blob){const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return `data:${blob.type||'image/jpeg'};base64,${btoa(binary)}`;}
async function deliverToSidePanel(payload){
 pendingSidePanels.set(payload.tabId,payload);
 try{
  const response=await chrome.runtime.sendMessage(payload);
  if(response?.ok&&pendingSidePanels.get(payload.tabId)===payload)pendingSidePanels.delete(payload.tabId);
 }catch{}
}
chrome.contextMenus.onClicked.addListener(async(info,tab)=>{
 if(!['shitu-image-mlx','shitu-image-chatgpt-web'].includes(info.menuItemId)||!tab?.id)return;
 const frame=info.frameId||0;
 chrome.action.setBadgeText({tabId:tab.id,text:''});
 let useSidePanel=false;
 try{
  const provider=info.menuItemId==='shitu-image-chatgpt-web'?'chatgpt-web':'mlx-adapter';
  if(chrome.sidePanel?.open){try{await chrome.sidePanel.open({tabId:tab.id});useSidePanel=true;}catch{}}
  await chrome.scripting.executeScript({target:{tabId:tab.id,frameIds:[frame]},files:['ui.js','panel.js']});
  const selection=await send(tab.id,frame,{type:'shitu-prepare',src:info.srcUrl});
  let image=selection?.data;
  if(!image){
   try{
    if(!/^https?:|^data:image\//.test(info.srcUrl))throw Error('需要截图');
    const r=await fetch(info.srcUrl,{credentials:'omit',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('读取原图失败');
    const blob=await r.blob();if(blob.size>40*1024*1024)throw Error('图片太大');
    if(!blob.type.startsWith('image/'))throw Error('不是图片');image=await dataURL(blob);
   }catch{
    // A full screenshot is never sent to the model. Crop on this device first.
    if(frame!==0||!selection?.rect||!selection.fullyVisible)throw Error('无法直接读取原图。请把图片完整显示后重试，或按 ⌃⌥I 仅框选这张图片。');
    const active=await chrome.tabs.query({active:true,windowId:tab.windowId});if(active[0]?.id!==tab.id)throw Error('请回到原图片页面后重新右键分析。');
    const screenshot=await chrome.tabs.captureVisibleTab(tab.windowId,{format:'png'});
    const cropped=await send(tab.id,frame,{type:'shitu-crop',screenshot,rect:selection.rect,viewport:selection.viewport});
    if(cropped.error)throw Error(cropped.error);image=cropped.data;
   }
  }
  const payload={type:'shitu-sidepanel-analyze',tabId:tab.id,image,name:selection?.name||'所选网页图片',pageUrl:info.pageUrl||tab.url||'',provider};
  if(useSidePanel)await deliverToSidePanel(payload);else await send(tab.id,frame,{type:'shitu-analyze',image,name:payload.name,pageUrl:payload.pageUrl,provider});
 }catch(e){
  try{
   if(useSidePanel)await deliverToSidePanel({type:'shitu-sidepanel-error',tabId:tab.id,error:e.message});
   else await send(tab.id,frame,{type:'shitu-error',error:e.message});
  }catch{
   chrome.action.setBadgeText({tabId:tab.id,text:'!'});chrome.action.setBadgeBackgroundColor({tabId:tab.id,color:'#b64a3b'});
   chrome.action.setTitle({tabId:tab.id,title:'拾图分析失败：'+e.message});console.warn('拾图：',e.message);
  }
 }
});
