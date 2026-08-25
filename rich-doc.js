// Rich document renderer: một nguồn nội dung cho editor, preview và PDF xuất ra.
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const form=$('.form-card');
  const previewWrap=$('.page-preview-wrap');
  if(!form||!previewWrap)return;

  const textMode=$('#textMode');
  const oldWrap=$('#customTextWrap');
  const oldText=$('#customText');
  let quill=null;

  const editorWrap=document.createElement('div');
  editorWrap.className='rich-editor-wrap hidden';
  editorWrap.innerHTML=`<div class="rich-editor-label"><span>Soạn nội dung có định dạng</span><small>Tiêu đề · đậm/nghiêng · danh sách · căn lề</small></div><div class="rich-editor"><div id="richToolbar"><span class="ql-formats"><select class="ql-header"><option selected></option><option value="1"></option><option value="2"></option><option value="3"></option></select></span><span class="ql-formats"><button class="ql-bold"></button><button class="ql-italic"></button><button class="ql-underline"></button><button class="ql-blockquote"></button></span><span class="ql-formats"><button class="ql-list" value="ordered"></button><button class="ql-list" value="bullet"></button></span><span class="ql-formats"><select class="ql-align"></select><button class="ql-clean"></button></span></div><div id="richEditor"></div></div>`;
  oldWrap?.insertAdjacentElement('afterend',editorWrap);

  if(window.Quill){
    quill=new Quill('#richEditor',{theme:'snow',modules:{toolbar:'#richToolbar'}});
    quill.setContents([{insert:'Nội dung tài liệu\n',{header:1}},{insert:'Bạn có thể chỉnh sửa nội dung, xuống dòng, tạo tiêu đề, danh sách và định dạng văn bản tại đây.\n\n'},{insert:'Mục kiểm thử\n',{header:2}},{insert:'Nội dung này sẽ được dùng chung cho phần xem trước và PDF xuất ra.\n'}]);
    quill.on('text-change',()=>{ if(oldText) oldText.value=quill.getText(); schedulePreview(); });
  }

  const richPreview=document.createElement('div');
  richPreview.className='rich-live-preview';
  previewWrap.appendChild(richPreview);
  document.body.classList.add('rich-mode-active');

  function advancedOn(){return $('#applyAdvancedToPdf')?.checked!==false}
  function selectedTemplate(){return advancedOn()?($('#docTemplate')?.value||'report'):'basic'}
  function currentPage(){return Math.max(1,Number($('#previewPageInput')?.value||1))}
  function pageCount(){return Math.max(1,Number($('#pageCount')?.value||1))}
  function imgUrls(){return $$('#previewList img').map(x=>x.src).filter(Boolean)}
  function imgFor(page){const a=imgUrls();return a.length?a[(page-1)%a.length]:''}
  function captionFor(page){return $('#showCaption')?.checked?`Hình ${page}. Ảnh minh họa dùng cho kiểm thử tài liệu.`:''}
  function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function para(s){return `<p>${safe(s)}</p>`}
  function tableHtml(kind,page){
    if(kind==='none')return'';
    const rows=kind==='high'?5:kind==='medium'?4:3;
    let body=''; for(let i=0;i<rows;i++)body+=`<tr><td>${i+1}</td><td>Hạng mục kiểm thử ${page}-${i+1}</td><td>${1+(i%4)}</td><td>${(125000+i*37000).toLocaleString('vi-VN')} đ</td><td>${((1+(i%4))*(125000+i*37000)).toLocaleString('vi-VN')} đ</td></tr>`;
    return `<table><thead><tr><th>STT</th><th>Hạng mục</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${body}</tbody></table>`;
  }
  const TEXT={
    report:['Báo cáo tổng hợp kết quả kiểm thử hệ thống','Tài liệu mô phỏng báo cáo vận hành, tiến độ và các chỉ số xử lý PDF. Nội dung được chia thành từng mục rõ ràng để kiểm tra khả năng hiển thị, trích xuất và lập chỉ mục.','Các chỉ số bên dưới chỉ là dữ liệu mẫu và không phản ánh hệ thống thực tế.'],
    contract:['HỢP ĐỒNG MẪU','Hai bên thống nhất phạm vi công việc, trách nhiệm, tiêu chí nghiệm thu và các điều khoản liên quan. Tài liệu này chỉ dùng để kiểm thử quy trình xử lý PDF.','Các điều khoản trong tài liệu không có giá trị pháp lý và chỉ là dữ liệu giả lập.'],
    invoice:['HÓA ĐƠN MẪU','Thông tin hàng hóa, số lượng, đơn giá và tổng thanh toán được tạo tự động để kiểm thử bảng biểu và khả năng đọc tài liệu.','Mọi thông tin giao dịch là dữ liệu mẫu.'],
    cv:['HỒ SƠ ỨNG VIÊN','Ứng viên giả lập có kinh nghiệm phát triển sản phẩm web, tích hợp hệ thống và tối ưu hiệu năng.','Kỹ năng và dự án bên dưới được tạo tự động để kiểm thử OCR, tìm kiếm và phân tích hồ sơ.'],
    catalog:['CATALOG SẢN PHẨM','Mỗi trang mô phỏng một sản phẩm với mô tả, tính năng, thông số và hình ảnh minh họa.','Dữ liệu catalog phù hợp để kiểm thử trình xem PDF, thumbnail và lưu trữ.'],
    form:['BIỂU MẪU KIỂM THỬ','Biểu mẫu mô phỏng các trường nhập liệu, ô chọn, khu vực chữ ký và thông tin liên hệ.','Mục tiêu là kiểm thử OCR, trích xuất trường và nhận dạng bố cục.'],
    mixed:['TÀI LIỆU HỖN HỢP','Trang được kết hợp giữa tiêu đề, đoạn văn, hình ảnh, danh sách và bảng để mô phỏng tài liệu thực tế.','Cấu trúc hỗn hợp giúp phát hiện lỗi mà file trắng hoặc file chỉ có một loại nội dung thường không thể hiện.'],
    basic:['Tài liệu kiểm thử PDF','Tài liệu được tạo tự động để kiểm thử tải lên, xem trước, lưu trữ và hiệu năng xử lý PDF.','Nội dung được trình bày theo bố cục tiêu chuẩn.']
  };
  function templateBody(page){
    const mode=textMode?.value||'auto';
    if(mode==='none') return imgFor(page)?`<img class="hero-image" src="${imgFor(page)}">`:'';
    if(mode==='custom'&&quill){return `<div class="editor-html">${quill.root.innerHTML}</div>${imgFor(page)?`<img class="hero-image" src="${imgFor(page)}"><div class="caption">${captionFor(page)}</div>`:''}`}
    const tpl=selectedTemplate(), t=TEXT[tpl]||TEXT.report, img=imgFor(page), table=tableHtml($('#tableMode')?.value||'none',page);
    if(tpl==='invoice')return `<h1>${t[0]}</h1><div class="meta-grid"><div>Mã hóa đơn: INV-${String(page).padStart(4,'0')}</div><div>Ngày: 25/08/2026</div><div>Khách hàng: Công ty Mẫu ${page}</div><div>Trạng thái: Đã tạo</div></div>${para(t[1])}${table||tableHtml('medium',page)}<div class="invoice-total">Tổng cộng: ${(570000+page*15000).toLocaleString('vi-VN')} đ</div>${para(t[2])}`;
    if(tpl==='contract')return `<h1>${t[0]}</h1>${para('Số: HD-'+String(page).padStart(3,'0')+'/2026')}${para(t[1])}<h2>Điều 1. Phạm vi công việc</h2>${para('Bên A giao và Bên B thực hiện các hạng mục mô phỏng phục vụ kiểm thử tài liệu, lưu trữ và xử lý dữ liệu.')}<h2>Điều 2. Trách nhiệm các bên</h2><ol><li>Cung cấp dữ liệu mẫu đúng định dạng.</li><li>Kiểm tra kết quả xử lý và phản hồi lỗi.</li><li>Bảo đảm tài liệu chỉ dùng cho mục đích kiểm thử.</li></ol>${para(t[2])}<div class="signature-grid"><div><b>ĐẠI DIỆN BÊN A</b><br><br><br>Ký và ghi rõ họ tên</div><div><b>ĐẠI DIỆN BÊN B</b><br><br><br>Ký và ghi rõ họ tên</div></div>`;
    if(tpl==='cv')return `<h1>${t[0]}</h1><div class="meta-grid"><div><b>Nguyễn Văn Mẫu</b></div><div>Frontend / Full-stack Developer</div><div>email@example.com</div><div>Hà Nội, Việt Nam</div></div>${para(t[1])}<h2>Kỹ năng</h2><p><span class="badge-line">JavaScript</span><span class="badge-line">Next.js</span><span class="badge-line">Node.js</span><span class="badge-line">UI/UX</span></p><h2>Kinh nghiệm</h2><ul><li>Phát triển giao diện và tối ưu hiệu năng ứng dụng.</li><li>Tích hợp API, lưu trữ và quy trình xử lý tài liệu.</li><li>Xây dựng công cụ nội bộ phục vụ kiểm thử.</li></ul>${para(t[2])}`;
    if(tpl==='form')return `<h1>${t[0]}</h1>${para(t[1])}<h2>Thông tin chung</h2><p>Họ và tên: <span class="form-line"></span></p><p>Mã hồ sơ: <span class="form-line"></span></p><p>Email: <span class="form-line"></span></p><p>Ngày tạo: <span class="form-line"></span></p><h2>Nội dung xác nhận</h2><p>☐ Đồng ý điều khoản &nbsp;&nbsp; ☐ Cần bổ sung hồ sơ &nbsp;&nbsp; ☐ Đã kiểm tra</p>${para(t[2])}`;
    if(tpl==='catalog')return `<h1>${t[0]}</h1>${img?`<img class="hero-image" src="${img}"><div class="caption">${captionFor(page)}</div>`:''}<h2>Sản phẩm mẫu ${page}</h2>${para(t[1])}<ul><li>Thiết kế phục vụ kiểm thử hiển thị.</li><li>Dữ liệu hoàn toàn giả lập.</li><li>Có thể kết hợp ảnh, mô tả và thông số.</li></ul>${para(t[2])}`;
    return `<h1>${t[0]}</h1><div class="meta-grid"><div>Trang: ${page}</div><div>Mẫu: ${safe(tpl)}</div><div>Trạng thái: Đang kiểm thử</div><div>Mã tài liệu: DOC-${String(page).padStart(4,'0')}</div></div>${para(t[1])}<h2>Tổng quan</h2>${para(t[2])}${img?`<img class="hero-image" src="${img}"><div class="caption">${captionFor(page)}</div>`:''}${table}<h2>Ghi chú kiểm thử</h2><ul><li>Kiểm tra xuống dòng và khoảng cách đoạn.</li><li>Kiểm tra tiêu đề, danh sách và bảng.</li><li>Kiểm tra ảnh và chú thích trong cùng trang.</li></ul>`;
  }
  function buildPage(page,total,forRender=false){
    const tpl=selectedTemplate(), scan=advancedOn()?($('#scanMode')?.value||'none'):'none';
    const scanClass=scan==='gray'?'scan-gray':scan==='soft'?'scan-soft':scan==='bad'?'scan-bad':'';
    const header=advancedOn()?($('#qaHeader')?.value||''):'';
    const footer=advancedOn()?($('#qaFooter')?.value||''):'';
    const wm=advancedOn()?($('#qaWatermark')?.value||''):'';
    const blank=advancedOn()&&$('#edgeBlank')?.checked&&page%11===8;
    const content=blank?'<div style="height:80%;display:grid;place-items:center;color:#b2b7bf;font-size:2%">Trang trắng có chủ đích để kiểm thử</div>':templateBody(page);
    return `<div class="rich-page ${scanClass}" data-page="${page}">${wm?`<div class="watermark">${safe(wm)}</div>`:''}${header?`<div class="doc-header">${safe(header)}</div>`:''}${content}<div class="doc-footer"><span>${safe(footer||'Tài liệu kiểm thử PDF')}</span><span>${$('#showPageNumber')?.checked?`Trang ${page} / ${total}`:''}</span></div></div>`;
  }

  function syncEditorVisibility(){
    const custom=textMode?.value==='custom';
    editorWrap.classList.toggle('hidden',!custom);
    if(oldWrap)oldWrap.classList.add('hidden');
  }
  let previewTimer=0;
  function schedulePreview(){clearTimeout(previewTimer);previewTimer=setTimeout(renderPreview,30)}
  function renderPreview(){
    syncEditorVisibility();
    const p=Math.min(pageCount(),currentPage());
    richPreview.classList.toggle('landscape',$('#orientation')?.value==='landscape');
    richPreview.innerHTML=buildPage(p,pageCount());
  }

  const watched=['#textMode','#textDensity','#layoutMode','#pageCount','#previewPageInput','#docTemplate','#tableMode','#qaHeader','#qaFooter','#qaWatermark','#scanMode','#applyAdvancedToPdf','#showCaption','#showPageNumber','#showHeading','#orientation','#edgeBlank'];
  watched.forEach(sel=>{const el=$(sel);el?.addEventListener('input',schedulePreview);el?.addEventListener('change',schedulePreview)});
  $('#previewPrev')?.addEventListener('click',()=>setTimeout(renderPreview,0));
  $('#previewNext')?.addEventListener('click',()=>setTimeout(renderPreview,0));
  $('#previewThumbnails')?.addEventListener('click',()=>setTimeout(renderPreview,0));
  $('#previewList')?.addEventListener('DOMNodeInserted',schedulePreview);
  $('#previewList')?.addEventListener('DOMNodeRemoved',schedulePreview);

  function pagePixelSize(){const size=$('#pageSize')?.value||'a4',land=$('#orientation')?.value==='landscape';let wh=size==='letter'?[816,1056]:size==='legal'?[816,1344]:[794,1123];if(land)wh=[wh[1],wh[0]];return wh}
  function targetBytes(){const n=Math.max(1,Number($('#targetSize')?.value)||1);return Math.round(n*(($('#sizeUnit')?.value||'mib')==='gib'?1024**3:1024**2))}
  function setProgress(v,label){const bar=$('#progressBar'),pct=$('#progressPercent'),txt=$('#progressLabel');if(bar)bar.style.width=`${v}%`;if(pct)pct.textContent=`${Math.round(v)}%`;if(txt)txt.textContent=label}
  async function waitImgs(root){await Promise.all($$('img',root).map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=img.onerror=r})))}

  async function generateRichPdf(){
    if(!window.html2canvas||!window.jspdf?.jsPDF){alert('Editor/PDF renderer chưa tải xong. Hãy tải lại trang và thử lại.');return}
    const btn=$('#generateBtn'), result=$('#resultBox'), dl=$('#downloadBtn'), tag=$('#statusTag');
    const total=pageCount();let name=($('#fileName')?.value||'tai-lieu-kiem-thu').trim();name=name.replace(/\.pdf$/i,'')+'.pdf';
    btn.disabled=true; result?.classList.add('hidden'); dl?.classList.add('disabled'); if(tag)tag.textContent='Đang tạo'; setProgress(2,'Chuẩn bị nội dung');
    const host=document.createElement('div');host.className='rich-render-host';document.body.appendChild(host);
    try{
      const [pxW,pxH]=pagePixelSize();
      const orientation=$('#orientation')?.value==='landscape'?'landscape':'portrait';
      const format=$('#pageSize')?.value==='letter'?'letter':$('#pageSize')?.value==='legal'?'legal':'a4';
      const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation,unit:'pt',format,compress:true});
      for(let page=1;page<=total;page++){
        if(page>1)pdf.addPage(format,orientation);
        const node=document.createElement('div');node.className='rich-render-page';node.style.width=pxW+'px';node.style.height=pxH+'px';node.innerHTML=buildPage(page,total,true);host.appendChild(node);
        const inner=$('.rich-page',node);inner.style.width=pxW+'px';inner.style.height=pxH+'px';inner.style.padding='52px 58px';
        $$('.rich-page h1',node).forEach(x=>x.style.fontSize='34px'); $$('.rich-page h2',node).forEach(x=>x.style.fontSize='21px'); $$('.rich-page h3',node).forEach(x=>x.style.fontSize='17px');
        $$('.rich-page p,.rich-page li',node).forEach(x=>x.style.fontSize='14px'); $$('.rich-page table',node).forEach(x=>x.style.fontSize='12px');
        $$('.doc-header,.doc-footer,.caption',node).forEach(x=>x.style.fontSize='10px');
        await waitImgs(node);
        const scale=$('#edgeHugeImage')?.checked?1.65:1.25;
        const canvas=await html2canvas(node,{backgroundColor:'#ffffff',scale,useCORS:true,logging:false});
        const imgData=canvas.toDataURL('image/jpeg',Math.max(.55,Number($('#imageQuality')?.value||82)/100));
        const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();pdf.addImage(imgData,'JPEG',0,0,pw,ph,undefined,'FAST');
        host.removeChild(node); setProgress(5+Math.round(page/total*68),`Đang dựng trang ${page}/${total}`); await new Promise(r=>setTimeout(r,0));
      }
      setProgress(78,'Đóng gói PDF');
      const raw=new Uint8Array(pdf.output('arraybuffer')),target=targetBytes();
      if(raw.length>target)throw new Error(`Nội dung thực tế đã ${Math.ceil(raw.length/1024/1024)} MB, lớn hơn dung lượng mục tiêu.`);
      const parts=[raw],chunk=8*1024*1024,zero=new Uint8Array(chunk);let left=target-raw.length;while(left>0){const n=Math.min(chunk,left);parts.push(n===chunk?zero:new Uint8Array(n));left-=n}
      const blob=new Blob(parts,{type:'application/pdf'});const url=URL.createObjectURL(blob);if(dl){dl.href=url;dl.download=name;dl.classList.remove('disabled');dl.textContent='Tải PDF'}
      const sum=$('#resultSummary');if(sum)sum.textContent=`${total} trang • ${(blob.size/1024/1024).toFixed(0)} MB • ${blob.size.toLocaleString('vi-VN')} byte`;result?.classList.remove('hidden');if(tag)tag.textContent='Hoàn tất';setProgress(100,'Đã tạo xong');
    }catch(err){console.error(err);if(tag)tag.textContent='Lỗi';setProgress(0,err.message);alert(err.message)}finally{host.remove();btn.disabled=false}
  }

  // Chỉ chặn luồng tạo PDF đơn. Khi bật tạo hàng loạt, giữ logic batch hiện có.
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('#generateBtn'); if(!btn)return; if($('#batchEnabled')?.checked)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();generateRichPdf();
  },true);

  renderPreview();
})();
