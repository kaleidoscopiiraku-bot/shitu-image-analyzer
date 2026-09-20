// Passive selection only. No page is scanned or sent to the model.
if (!globalThis.__shituSelectionInstalled) {
 globalThis.__shituSelectionInstalled=true;
 document.addEventListener('contextmenu',e=>{
  const path=e.composedPath();const image=path.find(x=>x instanceof HTMLImageElement)||e.target.closest?.('picture')?.querySelector('img');
  globalThis.__shituSelection=image||null;
 },true);
}
