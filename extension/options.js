const token=document.getElementById('token'),status=document.getElementById('status');
async function showState(){const saved=await chrome.storage.local.get('pairingToken');status.textContent=saved.pairingToken?'已保存本机配对码。打开 MiMo看图后即可使用。':'尚未连接此 Mac。';}
document.getElementById('connect').onclick=async()=>{
 const value=token.value.trim();if(!/^[A-Za-z0-9_-]{24,128}$/.test(value)){status.textContent='请粘贴 Mac 应用复制的完整配对码。';return;}
 status.textContent='正在连接本机应用…';
 try{
  const response=await fetch('http://127.0.0.1:19428/health',{headers:{Authorization:'Bearer '+value}});
  if(!response.ok)throw Error(response.status===401?'配对码不匹配，请从当前应用重新复制。':'本机服务拒绝了连接。');
  await chrome.storage.local.set({pairingToken:value});token.value='';status.textContent='连接成功，可以在图片上右键分析。';
 }catch(error){status.textContent=error instanceof TypeError?'无法连接，请先打开 Mac 版 MiMo看图。':error.message;}
};
document.getElementById('disconnect').onclick=async()=>{await chrome.storage.local.remove('pairingToken');token.value='';await showState();};
showState();
