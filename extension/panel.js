if(!globalThis.__shituPanelInstalled){
 document.addEventListener('contextmenu',e=>{globalThis.__shituSelection=e.composedPath().find(x=>x instanceof HTMLImageElement)||null;},true);
 globalThis.__shituPanelInstalled=true;
 let host=null,view=null;
 function panel(){
  if(host){host.style.display='block';return view;}
  host=document.createElement('div');host.setAttribute('data-shitu-panel','');
  Object.assign(host.style,{position:'fixed',top:'24px',right:'24px',width:'400px',maxWidth:'calc(100vw - 16px)',zIndex:'2147483647',colorScheme:'light'});
  const shadow=host.attachShadow({mode:'closed'}),style=document.createElement('link');style.rel='stylesheet';style.href=chrome.runtime.getURL('ui.css');shadow.append(style);
  const mount=document.createElement('div');shadow.append(mount);document.documentElement.append(host);
  view=mountInspector(mount,{close:()=>{view.destroy();host.remove();host=null;view=null;},prepareChatGPT:async(imageData,prompt)=>{
   let copiedImage=false,copiedPrompt=false;
   const copyPrompt=async()=>{
    try{await navigator.clipboard.writeText(prompt);return true;}catch{}
    try{const textarea=document.createElement('textarea');textarea.value=prompt;textarea.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';document.body.append(textarea);textarea.focus();textarea.select();const ok=document.execCommand('copy');textarea.remove();return ok;}catch{return false;}
   };
   try{
    if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw Error('当前浏览器不支持图片剪贴板');
    const png=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);canvas.toBlob(blob=>blob?resolve(blob):reject(Error('图片转换失败')),'image/png');}catch(e){reject(e);}};image.onerror=()=>reject(Error('图片转换失败'));image.src=imageData;});
    await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([prompt],{type:'text/plain'}),'image/png':png})]);copiedImage=true;copiedPrompt=true;
   }catch{
    copiedPrompt=await copyPrompt();
   }
   return copiedImage&&copiedPrompt?{}:{warning:copiedPrompt?'已复制分析要求；浏览器没有复制图片，请在 ChatGPT 中手动上传刚才选中的图片。':'图片和分析要求未能自动复制，请手动上传图片并从拾图重新复制分析要求。'};
  },request:async(path,body)=>{const response=await chrome.runtime.sendMessage({type:'shitu-api',path,body});if(response?.error)throw Error(response.error);if(!response?.data)throw Error('本地服务没有响应。');return response.data;}});
  mount.firstElementChild.style.maxHeight=(innerHeight-32)+'px';
  const resize=()=>{if(!host)return;const r=host.getBoundingClientRect();host.style.top=Math.max(8,Math.min(r.top,innerHeight-55))+'px';if(host.style.left)host.style.left=Math.max(8,Math.min(r.left,innerWidth-r.width-8))+'px';};
  let offset=null;view.head.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=host.getBoundingClientRect();offset={x:e.clientX-r.left,y:e.clientY-r.top};view.head.setPointerCapture(e.pointerId);e.preventDefault();});
  view.head.addEventListener('pointermove',e=>{if(!offset)return;host.style.right='auto';host.style.left=Math.max(8,Math.min(e.clientX-offset.x,innerWidth-host.offsetWidth-8))+'px';host.style.top=Math.max(8,Math.min(e.clientY-offset.y,innerHeight-55))+'px';mount.firstElementChild.style.maxHeight=(innerHeight-parseFloat(host.style.top)-8)+'px';});
  view.head.addEventListener('pointerup',()=>offset=null);view.head.addEventListener('pointercancel',()=>offset=null);
  window.addEventListener('resize',resize,{passive:true});return view;
 }
 function selected(src){const tracked=globalThis.__shituSelection;if(tracked?.isConnected&&(tracked.currentSrc===src||tracked.src===src))return tracked;return [...document.images].find(i=>i.currentSrc===src||i.src===src);}
 chrome.runtime.onMessage.addListener((m,sender,reply)=>{
  if(sender.id!==chrome.runtime.id)return;
  if(m.type==='shitu-prepare'){
   if(host)host.style.display='none';const image=selected(m.src);let data=null;
   if(image?.complete&&image.naturalWidth){try{const c=document.createElement('canvas'),s=Math.min(1,1280/Math.max(image.naturalWidth,image.naturalHeight));c.width=Math.round(image.naturalWidth*s);c.height=Math.round(image.naturalHeight*s);const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(image,0,0,c.width,c.height);data=c.toDataURL('image/jpeg',.9);}catch{}}
   const r=image?.getBoundingClientRect();const matches=[...document.images].filter(i=>i.currentSrc===m.src||i.src===m.src);const exact=globalThis.__shituSelection===image||matches.length===1;reply({data,name:image?.alt?.slice(0,100)||'所选网页图片',rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,viewport:{width:innerWidth,height:innerHeight},fullyVisible:exact&&!!r&&r.width>0&&r.height>0&&r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight});return;
  }
  if(m.type==='shitu-crop'){
   const image=new Image();image.onload=()=>{try{const c=document.createElement('canvas'),r=m.rect,sx=image.width/m.viewport.width,sy=image.height/m.viewport.height,scale=Math.min(1,1280/Math.max(r.width*sx,r.height*sy));c.width=Math.max(1,Math.round(r.width*sx*scale));c.height=Math.max(1,Math.round(r.height*sy*scale));c.getContext('2d').drawImage(image,r.x*sx,r.y*sy,r.width*sx,r.height*sy,0,0,c.width,c.height);reply({data:c.toDataURL('image/jpeg',.9)});}catch(e){reply({error:e.message});}};image.onerror=()=>reply({error:'截图裁切失败，请使用框选图片。'});image.src=m.screenshot;return true;
  }
  if(m.type==='shitu-analyze'){
   const active=panel();
   active.analyze(m.image,m.name,m.provider,m.pageUrl);
   reply({ok:true});return;
  }
  if(m.type==='shitu-error'){panel().showError(m.error);reply({ok:true});}
 });
}
