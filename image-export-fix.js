// Bảo đảm ảnh upload được nhúng thật vào preview HTML và PDF rasterized.
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const cache=new Map();

  async function toDataUrl(src){
    if(!src||src.startsWith('data:')) return src;
    if(cache.has(src)) return cache.get(src);
    const p=(async()=>{
      const blob=await fetch(src).then(r=>r.blob());
      return await new Promise((resolve,reject)=>{
        const fr=new FileReader();
        fr.onload=()=>resolve(fr.result);
        fr.onerror=reject;
        fr.readAsDataURL(blob);
      });
    })();
    cache.set(src,p);
    try{return await p}catch(e){cache.delete(src);throw e}
  }

  async function normalizePreviewImages(){
    const imgs=$$('#previewList img');
    await Promise.all(imgs.map(async img=>{
      try{
        const data=await toDataUrl(img.src);
        if(data&&img.src!==data){
          img.dataset.originalSrc=img.src;
          img.src=data;
        }
      }catch(e){console.warn('Không thể chuẩn hóa ảnh để xuất PDF',e)}
    }));
  }

  // Khi có ảnh mới, đổi blob URL sang data URL để html2canvas luôn đọc được.
  const list=$('#previewList');
  if(list){
    const mo=new MutationObserver(()=>{normalizePreviewImages()});
    mo.observe(list,{childList:true,subtree:true});
    normalizePreviewImages();
  }

  // Chạy trước listener tạo PDF của rich-doc.js.
  document.addEventListener('click',async e=>{
    const btn=e.target.closest?.('#generateBtn');
    if(!btn||$('#batchEnabled')?.checked) return;
    // Không chặn event, chỉ chuẩn hóa ảnh trước. Listener tạo PDF phía sau sẽ dùng data URL.
    try{
      e.stopImmediatePropagation();
      await normalizePreviewImages();
      // Phát lại click sau khi ảnh đã sẵn sàng. Dùng cờ để tránh lặp vô hạn.
      if(btn.dataset.imageReadyClick==='1'){
        delete btn.dataset.imageReadyClick;
        return;
      }
      btn.dataset.imageReadyClick='1';
      setTimeout(()=>btn.click(),0);
    }catch(err){
      console.error(err);
      alert('Không thể chuẩn bị ảnh để tạo PDF: '+(err.message||err));
    }
  },true);
})();
