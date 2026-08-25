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
    $('#previewPageInput')?.dispatchEvent(new Event('input',{bubbles:true}));
  }

  const list=$('#previewList');
  if(list){
    const mo=new MutationObserver(()=>{normalizePreviewImages()});
    mo.observe(list,{childList:true,subtree:true});
    normalizePreviewImages();
  }

  window.__normalizePdfImages=normalizePreviewImages;
})();
