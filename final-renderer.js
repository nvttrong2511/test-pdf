// Renderer cuối cùng: một nút tạo PDF, một pipeline duy nhất, luôn nhúng ảnh upload.
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const oldBtn=$('#generateBtn');
  if(!oldBtn) return;

  const btn=oldBtn.cloneNode(true);
  oldBtn.replaceWith(btn); // loại toàn bộ listener cũ gắn trên nút.

  const cache=new Map();
  async function toDataUrl(src){
    if(!src||src.startsWith('data:')) return src;
    if(cache.has(src)) return cache.get(src);
    const p=(async()=>{
      const blob=await fetch(src).then(r=>r.blob());
      return await new Promise((resolve,reject)=>{
        const fr=new FileReader(); fr.onload=()=>resolve(fr.result); fr.onerror=reject; fr.readAsDataURL(blob);
      });
    })();
    cache.set(src,p); return p;
  }
  async function getImages(){
    const srcs=$$('#previewList img').map(x=>x.src).filter(Boolean);
    return Promise.all(srcs.map(toDataUrl));
  }
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function templateTitle(){
    const v=$('#docTemplate')?.value||'report';
    return ({report:'Báo cáo kiểm thử',contract:'Hợp đồng mẫu',invoice:'Hóa đơn mẫu',cv:'Hồ sơ mẫu',catalog:'Danh mục sản phẩm',form:'Biểu mẫu kiểm thử',mixed:'Tài liệu hỗn hợp'})[v]||'Tài liệu kiểm thử';
  }
  function autoHtml(page){
    const title=templateTitle();
    const density=$('#textDensity')?.value||'medium';
    const repeat={low:1,medium:2,high:4}[density]||2;
    const p='Tài liệu này được tạo tự động để kiểm thử tải lên, lưu trữ, xem trước, OCR và hiệu năng xử lý PDF. Nội dung chỉ là dữ liệu mẫu phục vụ kiểm thử hệ thống.';
    let body=`<h1>${esc(title)}</h1><p><b>Trang ${page}</b> · Nội dung mẫu phục vụ kiểm thử.</p>`;
    for(let i=0;i<repeat;i++) body+=`<p>${esc(p)}</p>`;
    const table=$('#tableMode')?.value||'none';
    if(table!=='none') body+=`<table><thead><tr><th>STT</th><th>Hạng mục</th><th>Số lượng</th><th>Giá trị</th></tr></thead><tbody><tr><td>1</td><td>Dữ liệu mẫu A</td><td>2</td><td>250.000</td></tr><tr><td>2</td><td>Dữ liệu mẫu B</td><td>1</td><td>320.000</td></tr></tbody></table>`;
    return body;
  }
  function textHtml(page){
    const mode=$('#textMode')?.value||'auto';
    if(mode==='none') return '';
    if(mode==='custom'){
      const q=$('#richEditor .ql-editor');
      const native=$('#nativeRichEditor');
      const html=q?.innerHTML||native?.innerHTML||'';
      return `<div class="editor-copy">${html}</div>`;
    }
    return autoHtml(page);
  }
  function layoutFor(page,hasImage){
    const m=$('#layoutMode')?.value||'random';
    if(!hasImage) return 'text-only';
    if(m!=='random') return m;
    return ['text-image','image-text','full-image','text-image'][(page-1)%4];
  }
  function imageBlock(src,page,cls=''){ if(!src)return''; return `<figure class="img-block ${cls}"><img src="${src}"/><figcaption>${$('#showCaption')?.checked?`Hình ${page}. Ảnh được tải lên để kiểm thử.`:''}</figcaption></figure>`; }
  function pageHtml(page,total,imgs){
    const src=imgs.length?imgs[(page-1)%imgs.length]:'';
    const layout=layoutFor(page,!!src), txt=textHtml(page), header=$('#qaHeader')?.value?.trim()||'', footer=$('#qaFooter')?.value?.trim()||'', wm=$('#qaWatermark')?.value?.trim()||'';
    if($('#edgeBlank')?.checked && page%11===8) return `<div class="pdf-page blank"><div>Trang trắng có chủ đích</div></div>`;
    let content='';
    if(layout==='full-image'&&src) content=imageBlock(src,page,'full');
    else if(layout==='image-text') content=`${imageBlock(src,page)}<div class="text-block">${txt}</div>`;
    else if(layout==='text-image') content=`<div class="text-block">${txt}</div>${imageBlock(src,page)}`;
    else content=`<div class="text-block">${txt}</div>`;
    const scan=$('#scanMode')?.value||'none';
    return `<div class="pdf-page scan-${scan}">${wm?`<div class="wm">${esc(wm)}</div>`:''}${header?`<div class="hdr">${esc(header)}</div>`:''}<main>${content}</main><div class="ftr"><span>${esc(footer)}</span><span>${$('#showPageNumber')?.checked?`Trang ${page} / ${total}`:''}</span></div></div>`;
  }
  function pagePixels(){ const s=$('#pageSize')?.value||'a4'; let wh=s==='letter'?[816,1056]:s==='legal'?[816,1344]:[794,1123]; if($('#orientation')?.value==='landscape') wh=[wh[1],wh[0]]; return wh; }
  function targetBytes(){const n=Math.max(1,Number($('#targetSize')?.value)||1);return Math.round(n*(($('#sizeUnit')?.value||'mib')==='gib'?1024**3:1024**2));}
  function setProgress(v,t){const bar=$('#progressBar'),pct=$('#progressPercent'),lab=$('#progressLabel');if(bar)bar.style.width=v+'%';if(pct)pct.textContent=Math.round(v)+'%';if(lab)lab.textContent=t;}
  async function waitImgs(root){await Promise.all($$('img',root).map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=img.onerror=r;})));}
  function css(){return `<style>
    *{box-sizing:border-box} body{margin:0}.pdf-page{position:relative;width:100%;height:100%;padding:52px 58px 50px;background:#fff;color:#151922;font:14px/1.55 Arial,sans-serif;overflow:hidden}.pdf-page main{height:calc(100% - 34px);overflow:hidden}.hdr{font-size:10px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:18px;color:#666}.ftr{position:absolute;left:58px;right:58px;bottom:18px;border-top:1px solid #e3e3e3;padding-top:7px;font-size:9px;color:#777;display:flex;justify-content:space-between}.wm{position:absolute;inset:0;display:grid;place-items:center;font-size:70px;font-weight:700;color:rgba(90,90,90,.1);transform:rotate(-28deg);z-index:5;pointer-events:none}.text-block h1,.editor-copy h1{font-size:34px;line-height:1.15;margin:0 0 18px}.text-block h2,.editor-copy h2{font-size:23px;margin:24px 0 12px}.text-block h3,.editor-copy h3{font-size:18px;margin:20px 0 10px}.text-block p,.editor-copy p{font-size:14px;margin:0 0 12px;white-space:pre-wrap}.editor-copy .ql-align-center{text-align:center}.editor-copy .ql-align-right{text-align:right}.editor-copy .ql-align-justify{text-align:justify}.editor-copy ul,.editor-copy ol{padding-left:28px}.img-block{margin:18px 0 0;height:43%;display:flex;flex-direction:column}.img-block img{width:100%;height:calc(100% - 20px);object-fit:${$('input[name="imageMode"]:checked')?.value==='contain'?'contain':$('input[name="imageMode"]:checked')?.value==='stretch'?'fill':'cover'};display:block}.img-block figcaption{height:20px;font-size:10px;color:#777;padding-top:5px}.img-block.full{height:92%;margin:0}.img-block.full img{height:100%}.img-block.full figcaption{position:absolute;bottom:38px;left:58px;color:#666}.text-block+.img-block{height:46%}.img-block+.text-block{margin-top:18px}.pdf-page table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}.pdf-page th,.pdf-page td{border:1px solid #ddd;padding:7px;text-align:left}.pdf-page th{background:#f3f4f6}.scan-gray{filter:grayscale(1)}.scan-soft{filter:grayscale(.65) contrast(.92)}.scan-bad{filter:grayscale(1) contrast(.78) brightness(1.06)}.scan-mixed{filter:grayscale(.4)}.blank{display:grid;place-items:center;color:#bbb;font-size:13px}
  </style>`;}

  async function generate(){
    if(!window.html2canvas||!window.jspdf?.jsPDF){alert('Bộ tạo PDF chưa tải xong. Hãy tải lại trang.');return;}
    if($('#batchEnabled')?.checked){ $('#batchBtn')?.click(); return; }
    btn.disabled=true; $('#downloadBtn')?.classList.add('disabled'); $('#resultBox')?.classList.add('hidden'); setProgress(2,'Chuẩn bị ảnh');
    const host=document.createElement('div'); host.style.cssText='position:fixed;left:-20000px;top:0;'; document.body.appendChild(host);
    try{
      const imgs=await getImages();
      const total=Math.max(1,Number($('#pageCount')?.value)||1);
      const [w,h]=pagePixels();
      const orientation=$('#orientation')?.value==='landscape'?'landscape':'portrait';
      const format=$('#pageSize')?.value==='letter'?'letter':$('#pageSize')?.value==='legal'?'legal':'a4';
      const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation,unit:'pt',format,compress:true});
      for(let page=1;page<=total;page++){
        if(page>1) pdf.addPage(format,orientation);
        const node=document.createElement('div'); node.style.width=w+'px';node.style.height=h+'px';node.innerHTML=css()+pageHtml(page,total,imgs);host.appendChild(node);
        await waitImgs(node);
        const canvas=await html2canvas(node,{backgroundColor:'#fff',scale:1.25,useCORS:false,logging:false,allowTaint:true});
        const jpg=canvas.toDataURL('image/jpeg',Math.max(.55,Number($('#imageQuality')?.value||82)/100));
        const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();pdf.addImage(jpg,'JPEG',0,0,pw,ph,undefined,'FAST');
        node.remove(); setProgress(5+page/total*68,`Đang dựng trang ${page}/${total}`); await new Promise(r=>setTimeout(r,0));
      }
      const raw=new Uint8Array(pdf.output('arraybuffer')); const target=targetBytes();
      if(raw.length>target) throw new Error(`Nội dung thực tế đã ${Math.ceil(raw.length/1024/1024)} MB, lớn hơn dung lượng mục tiêu.`);
      const parts=[raw],chunk=8*1024*1024,zero=new Uint8Array(chunk);let left=target-raw.length;while(left>0){const n=Math.min(left,chunk);parts.push(n===chunk?zero:new Uint8Array(n));left-=n;}
      const blob=new Blob(parts,{type:'application/pdf'}),url=URL.createObjectURL(blob);const dl=$('#downloadBtn');let name=($('#fileName')?.value||'test-pdf').replace(/\.pdf$/i,'')+'.pdf';if(dl){dl.href=url;dl.download=name;dl.classList.remove('disabled');dl.textContent='Tải PDF';}
      const sum=$('#resultSummary');if(sum)sum.textContent=`${total} trang • ${(blob.size/1024/1024).toFixed(0)} MB • ${imgs.length} ảnh nguồn`;$('#resultBox')?.classList.remove('hidden');if($('#statusTag'))$('#statusTag').textContent='Hoàn tất';setProgress(100,'Đã tạo xong');
    }catch(e){console.error(e);if($('#statusTag'))$('#statusTag').textContent='Lỗi';setProgress(0,e.message||String(e));alert(e.message||String(e));}
    finally{host.remove();btn.disabled=false;}
  }

  btn.addEventListener('click',generate);
  const batch=$('#batchEnabled'),count=$('#batchCount');
  function syncLabel(){btn.textContent=batch?.checked?`Tạo ${Math.max(1,Number(count?.value||1))} PDF và tải ZIP`:'Tạo PDF';}
  batch?.addEventListener('change',syncLabel); count?.addEventListener('input',syncLabel); syncLabel();
})();