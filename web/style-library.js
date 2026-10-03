/* Personal style library. Only explicitly starred style IDs are stored locally. */
(() => {
const categories=['全部','手绘插画','版画印刷','纸艺拼贴','几何图形','立体材质','像素数码','东方写意'];
function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
function button(text,handler,cls=''){const b=node('button',cls,text);b.type='button';b.onclick=handler;return b;}
window.mountStyleLibrary=function(root,options={}){
 let records=[],category='全部',selected=null,sort='newest',loaded=false,favoritesOnly=false;
 const favoriteKey='shitu.styleFavorites.v1';let favorites=new Set();
 try{const saved=JSON.parse(localStorage.getItem(favoriteKey)||'[]');if(Array.isArray(saved))favorites=new Set(saved.filter(x=>typeof x==='string'));}catch(_){/* Browse remains available if storage is unavailable. */}
 const list=node('section','sl-browse'),detail=node('section','sl-detail ii-hidden');
 const eyebrow=node('div','sl-eyebrow','STYLE LIBRARY / 风格提示词');
 const hero=node('header','sl-hero'),title=node('h1','','找到画风，开始创作。');
 const subtitle=node('p','sl-subtitle','看效果，选风格，复制提示词。');
 const stats=node('div','sl-stats','正在读取风格…');hero.append(eyebrow,title,subtitle,stats);
 const collectionTabs=node('nav','sl-collection-tabs');collectionTabs.setAttribute('aria-label','风格资料夹');
 const allStyles=button('全部风格',()=>{favoritesOnly=false;render();},'sl-collection-tab');
 const savedStyles=button('☆ 收藏夹',()=>{favoritesOnly=true;render();},'sl-collection-tab');collectionTabs.append(allStyles,savedStyles);
 const tools=node('div','sl-tools'),search=node('input','sl-search');search.type='search';search.placeholder='搜索画风、材质、关键词或编号…';search.setAttribute('aria-label','搜索风格');
 const order=node('select','sl-order');order.setAttribute('aria-label','风格排序');
 for(const [value,label] of [['newest','编号从新到旧'],['oldest','编号从旧到新'],['name','名称排序']]){const o=node('option','',label);o.value=value;order.append(o);}
 const count=node('span','sl-count','');tools.append(search,order);
 const filters=node('nav','sl-filters');filters.setAttribute('aria-label','风格分类');
 const chips=categories.map(label=>{const b=button(label,()=>{category=label;render();},'sl-chip');filters.append(b);return b;});
 const grid=node('div','sl-grid'),empty=node('div','sl-empty ii-hidden'),status=node('div','sl-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const emptyHeading=node('h2'),emptyHint=node('p'),emptyAction=button('清除筛选',()=>{search.value='';category='全部';if(favoritesOnly&&!favorites.size)favoritesOnly=false;render();});
 empty.append(emptyHeading,emptyHint,emptyAction);
 list.append(hero,collectionTabs,tools,filters,count,grid,empty);root.append(list,detail,status);
 function announce(text){status.textContent=text;clearTimeout(status.timer);status.timer=setTimeout(()=>status.textContent='',2600);}
 function favoriteButton(record){
  const b=button('',()=>{
   const next=new Set(favorites);next.has(record.id)?next.delete(record.id):next.add(record.id);
   try{localStorage.setItem(favoriteKey,JSON.stringify([...next]));favorites=next;render();syncFavoriteButtons();announce((favorites.has(record.id)?'已收藏「':'已取消收藏「')+record.title+'」');}
   catch(_){announce('收藏未能保存，请重试。');}
  },'sl-favorite');b.dataset.favoriteId=record.id;b.dataset.favoriteTitle=record.title;updateFavoriteButton(b);return b;
 }
 function updateFavoriteButton(b){const active=favorites.has(b.dataset.favoriteId);b.textContent=active?'★ 已收藏':'☆ 收藏';b.classList.toggle('sl-favorited',active);b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',(active?'取消收藏':'收藏')+b.dataset.favoriteTitle);}
 function syncFavoriteButtons(){root.querySelectorAll('[data-favorite-id]').forEach(updateFavoriteButton);}
 async function copyText(text){
  if(options.native){await options.native('copy',text);return;}
  try{if(navigator.clipboard){await navigator.clipboard.writeText(text);return;}}
  catch(_){/* File previews and older browser panels use the visible-copy fallback. */}
  const area=node('textarea','sl-copy-buffer');area.value=text;root.append(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw Error('请选中提示词后按 ⌘C 复制。');
 }
 async function copyStyle(record,b){
  if(!record.prompt){announce('这条公开笔记未提供提示词，补充后即可复制。');return;}
  const old=b.textContent;
  try{await copyText(record.prompt);b.textContent='已复制 ✓';announce('已复制「'+record.title+'」的风格提示词');setTimeout(()=>b.textContent=old,1600);}
  catch(e){announce(e.message);}
 }
 function safeLink(url){try{const u=new URL(url);return u.protocol==='https:'?u.href:null;}catch(_){return null;}}
 function openLink(url){const safe=safeLink(url);if(!safe)return;if(options.native)options.native('open-link',safe);else window.open(safe,'_blank','noopener,noreferrer');}
 function preview(record,large=false){
  const frame=node('div','sl-preview'+(large?' sl-preview-large':''));
  frame.style.aspectRatio=String(large?(record.comparisonAspect||(record.previewMode==='right'?record.previewAspect*2:record.previewAspect/2)):(4/3));
  if(record.preview){const image=node('img');image.src=record.preview;image.alt=record.title+' · 原图与成片对比';image.loading=large?'eager':'lazy';image.decoding='async';
   image.onerror=()=>{frame.replaceChildren(node('span','sl-no-image','预览暂不可用'));};frame.append(image);
  }else frame.append(node('span','sl-no-image','暂无预览'));
  return frame;
 }
 function render(){
  const terms=search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matching=records.filter(r=>(!favoritesOnly||favorites.has(r.id))&&(category==='全部'||r.categories.includes(category))&&terms.every(t=>(r.title+' '+r.number+' p'+r.number+' '+r.categories.join(' ')+' '+r.prompt).toLocaleLowerCase().includes(t)));
  matching.sort((a,b)=>sort==='name'?a.title.localeCompare(b.title,'zh-CN'):sort==='oldest'?a.number-b.number:b.number-a.number);
  chips.forEach((c,i)=>{c.classList.toggle('sl-chip-active',categories[i]===category);c.setAttribute('aria-pressed',String(categories[i]===category));});
  allStyles.setAttribute('aria-pressed',String(!favoritesOnly));savedStyles.setAttribute('aria-pressed',String(favoritesOnly));savedStyles.textContent='★ 收藏夹 · '+favorites.size;
  emptyHeading.textContent=favoritesOnly&&!favorites.size?'还没有收藏的风格':'没有找到这个画风';emptyHint.textContent=favoritesOnly&&!favorites.size?'点击风格卡片上的“☆ 收藏”，常用画风就会出现在这里。':'试试“水彩”“纸艺”或一个编号。';emptyAction.textContent=favoritesOnly&&!favorites.size?'浏览全部风格':'清除筛选';
  count.textContent=matching.length+' 种风格'+(search.value.trim()?' · “'+search.value.trim()+'”':'');
  grid.replaceChildren();empty.classList.toggle('ii-hidden',matching.length!==0||!loaded);
  for(const r of matching){
   const card=node('article','sl-card');const enter=button('',()=>openDetail(r),'sl-card-open');enter.setAttribute('aria-label','查看'+r.title);enter.append(preview(r));
   const info=node('div','sl-card-info');info.append(node('span','sl-number',(r.number?'P'+String(r.number).padStart(3,'0'):'未编号')+' · '+r.sourceStatus),node('h2','',r.title),node('p','sl-card-category',r.categories.join(' / ')));enter.append(info);
   const copy=button(r.prompt?(r.sourceStatus==='公开描述'?'复制风格描述':'复制提示词'):'提示词待补充',()=>copyStyle(r,copy),'sl-card-copy');copy.disabled=!r.prompt;const actions=node('div','sl-card-actions');actions.append(copy,favoriteButton(r));card.append(enter,actions);grid.append(card);
  }
 }
 function closeDetail(){selected=null;list.classList.remove('ii-hidden');detail.classList.add('ii-hidden');options.onDetail?.(false);search.focus({preventScroll:true});}
 function openDetail(record){
  selected=record;list.classList.add('ii-hidden');detail.classList.remove('ii-hidden');detail.replaceChildren();
  const back=button('← 返回风格库',closeDetail,'sl-back');const heading=node('header','sl-detail-heading');heading.append(node('div','sl-eyebrow',(record.number?'P'+String(record.number).padStart(3,'0'):'未编号')+' / '+record.categories.join(' · ')),node('h1','',record.title));
  const columns=node('div','sl-detail-columns'),art=node('aside','sl-art');art.append(preview(record,true),node('p','sl-caption','作者效果示例 · 原图与成片完整对比'));
  const content=node('div','sl-prompt-column'),bar=node('div','sl-prompt-bar');bar.append(node('h2','','风格提示词'));
  const copy=button(record.prompt?(record.sourceStatus==='公开描述'?'复制风格描述':'复制提示词'):'提示词待补充',()=>copyStyle(record,copy),'sl-copy-primary');copy.disabled=!record.prompt;bar.append(favoriteButton(record),copy);
  const prompt=node('textarea','sl-prompt');prompt.value=record.prompt||'尚未获取这条风格的可复制提示词原文。可以查看公开来源或核对已收录内容。';prompt.readOnly=true;prompt.setAttribute('aria-label',record.title+'的风格提示词');prompt.spellcheck=false;
  const note=node('p','sl-caption',record.sourceNote||(record.sourceStatus==='公开原始档案'?'已移除照片对照的展示要求，保留原有画风、配色、材质与构图语言。':record.sourceStatus+' · 按公开内容收录，未补写缺失的原文。'));
  const source=node('div','sl-source');source.append(node('span','','来源：'+(record.publisher||'小小东')));
  if(record.sourceUrl)source.append(button('查看公开来源 ↗',()=>openLink(record.sourceUrl)));
  if(record.xhsUrl)source.append(button('小红书笔记 ↗',()=>openLink(record.xhsUrl)));
  if(record.attachmentUrl)source.append(button('查看提示词附件 ↗',()=>openLink(record.attachmentUrl)));
  const original=node('details','sl-original');original.append(node('summary','',record.originalLabel||'核对原文'),node('pre','',record.original));
  content.append(bar,note,prompt,source,original);columns.append(art,content);detail.append(back,heading,columns);
  options.onDetail?.(true);back.focus({preventScroll:true});
 }
 search.oninput=render;order.onchange=()=>{sort=order.value;render();};
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&selected)closeDetail();});
 async function load(){
  if(loaded)return;
  try{
   const inline=document.getElementById('styles-data');const data=inline?JSON.parse(inline.textContent):await options.request('/styles');
   records=Array.isArray(data.styles)?data.styles:[];loaded=true;
   stats.textContent=records.length+' 条风格参考 · '+records.filter(r=>r.prompt).length+' 条可复制 · 本机资料库';
   render();
  }catch(e){stats.textContent='风格库暂时无法读取';grid.replaceChildren(node('p','sl-caption',e.message));}
 }
 return {load,closeDetail,get records(){return records;}};
};
})();
