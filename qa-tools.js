// Công cụ kiểm thử nâng cao - mọi tùy chọn được áp dụng trực tiếp vào PDF chính.
(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const form = $('.form-card');
  const uploadHeading = $('.upload-heading');
  if (!form || !uploadHeading) return;

  // Giao diện cấu hình nâng cao.
  const panel = document.createElement('div');
  panel.className = 'qa-panel';
  panel.innerHTML = `
    <div class="section-title"><h2>Công cụ kiểm thử nâng cao</h2><span>Áp dụng vào PDF chính</span></div>
    <div class="three-col">
      <label><span>Mẫu tài liệu</span><select id="docTemplate">
        <option value="report">Báo cáo</option><option value="contract">Hợp đồng</option><option value="invoice">Hóa đơn</option>
        <option value="cv">CV / Hồ sơ</option><option value="catalog">Danh mục sản phẩm</option><option value="form">Biểu mẫu</option><option value="mixed">Tài liệu hỗn hợp</option>
      </select></label>
      <label><span>Chế độ bản quét</span><select id="scanMode">
        <option value="none">PDF thông thường</option><option value="gray">Bản quét xám</option><option value="soft">Bản quét nhẹ</option>
        <option value="bad">Bản quét xấu / thử OCR</option><option value="mixed">Bản quét hỗn hợp</option>
      </select></label>
      <label><span>Mật độ bảng</span><select id="tableMode"><option value="none">Không có</option><option value="low">Ít</option><option value="medium">Vừa</option><option value="high">Nhiều</option></select></label>
    </div>
    <div class="three-col">
      <label><span>Đầu trang</span><input id="qaHeader" value="TÀI LIỆU KIỂM THỬ" /></label>
      <label><span>Chân trang</span><input id="qaFooter" value="Được tạo bởi công cụ kiểm thử PDF" /></label>
      <label><span>Dấu chìm</span><input id="qaWatermark" placeholder="MẪU / BẢN NHÁP / BẢO MẬT" /></label>
    </div>
    <div class="three-col">
      <label><span>Mã tái tạo ngẫu nhiên</span><input id="qaSeed" type="number" value="123456" /></label>
      <label><span>Chế độ dung lượng</span><select id="sizeMode"><option value="exact">Chính xác</option><option value="range">Ngẫu nhiên trong khoảng</option></select></label>
      <label><span>Số file tạo hàng loạt</span><input id="batchCount" type="number" min="1" max="50" value="5" /></label>
    </div>
    <div id="sizeRangeRow" class="two-col qa-hidden"><label><span>Từ (MB)</span><input id="sizeMin" type="number" value="20" min="1" /></label><label><span>Đến (MB)</span><input id="sizeMax" type="number" value="100" min="1" /></label></div>
    <div class="qa-subtitle">Tình huống kiểm thử đặc biệt</div>
    <div class="toggle-row qa-toggles">
      <label class="toggle"><input id="edgeBlank" type="checkbox"/><span>Trang trắng</span></label>
      <label class="toggle"><input id="edgeRotate" type="checkbox"/><span>Xoay 90°</span></label>
      <label class="toggle"><input id="edgeMixedSize" type="checkbox"/><span>Khổ trang khác nhau</span></label>
      <label class="toggle"><input id="edgeHugeImage" type="checkbox"/><span>Ảnh nặng</span></label>
      <label class="toggle"><input id="edgeTextHeavy" type="checkbox"/><span>Rất nhiều chữ</span></label>
      <label class="toggle"><input id="edgeSpecial" type="checkbox"/><span>Ký tự đặc biệt</span></label>
    </div>
    <div class="qa-subtitle">Cấu hình kiểm thử có sẵn</div>
    <div class="preset-row qa-presets">
      <button type="button" data-preset="small" class="chip">File nhỏ 5 MB</button>
      <button type="button" data-preset="large" class="chip">File lớn 300 MB</button>
      <button type="button" data-preset="huge" class="chip">File rất lớn 1 GB</button>
      <button type="button" data-preset="ocr" class="chip">Kiểm thử OCR</button>
      <button type="button" data-preset="image" class="chip">Nhiều hình ảnh</button>
      <button type="button" data-preset="text" class="chip">Nhiều văn bản</button>
      <button type="button" data-preset="mixed" class="chip">Tài liệu hỗn hợp</button>
      <button type="button" data-preset="unicode" class="chip">Kiểm thử Unicode</button>
    </div>
    <div class="qa-subtitle">Kịch bản kiểm thử</div>
    <div class="two-col">
      <label><span>Kịch bản</span><select id="testProfile">
        <option value="manual">Tùy chỉnh</option><option value="upload">Kiểm thử tải lên API</option><option value="ocr">Kiểm thử quy trình OCR</option>
        <option value="viewer">Kiểm thử trình xem PDF</option><option value="storage">Kiểm thử lưu trữ / CDN</option>
      </select></label>
      <div class="ram-card"><span>Ước tính RAM</span><strong id="ramEstimate">~390–510 MB</strong><small id="ramWarning">An toàn trên đa số máy tính</small></div>
    </div>
    <div class="two-col qa-actions"><button type="button" id="batchBtn" class="secondary-action">Tạo nhiều PDF và tải ZIP</button><button type="button" id="randomizeBtn" class="secondary-action">Tạo cấu hình ngẫu nhiên cho PDF</button></div>`;
  form.insertBefore(panel, uploadHeading);

  const original = {
    autoText: window.autoText,
    pageText: window.pageText,
    layoutFor: window.layoutFor,
    fileToJpeg: window.fileToJpeg,
    buildPdf: window.buildPdf,
    targetBytes: window.targetBytes
  };

  function seedValue(extra = 0) { return ((Number($('#qaSeed')?.value || 123456) >>> 0) + extra) >>> 0; }
  function rng(extra = 0) {
    let x = seedValue(extra) || 1;
    return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
  }
  function asciiPdf(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '?')
      .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  const templateText = {
    report: [
      'Báo cáo tổng hợp mô phỏng dữ liệu vận hành, tiến độ và các chỉ số kiểm thử hệ thống.',
      'Phần này trình bày kết quả, nhận xét và dữ liệu tham khảo phục vụ đánh giá hiệu năng.'
    ],
    contract: [
      'BÊN A và BÊN B thống nhất các điều khoản, phạm vi công việc, trách nhiệm và điều kiện thực hiện theo tài liệu mẫu này.',
      'Các điều khoản dưới đây chỉ là dữ liệu kiểm thử và không có giá trị pháp lý.'
    ],
    invoice: [
      'HÓA ĐƠN MẪU - Danh sách hàng hóa, số lượng, đơn giá, thuế và tổng giá trị thanh toán được sinh tự động.',
      'Thông tin khách hàng và giao dịch trong tài liệu này hoàn toàn là dữ liệu giả lập.'
    ],
    cv: [
      'HỒ SƠ ỨNG VIÊN - Kinh nghiệm, kỹ năng, dự án và thành tựu được tạo tự động để kiểm thử quy trình xử lý tài liệu.',
      'Thông tin cá nhân trong tài liệu là dữ liệu mẫu.'
    ],
    catalog: [
      'DANH MỤC SẢN PHẨM - Mỗi trang mô phỏng mô tả sản phẩm, tính năng, thông số và hình ảnh minh họa.',
      'Dữ liệu được sinh tự động phục vụ kiểm thử trình xem tài liệu và hệ thống lưu trữ.'
    ],
    form: [
      'BIỂU MẪU KIỂM THỬ - Họ tên: __________  Mã hồ sơ: __________  Ngày: ____/____/______',
      'Các trường biểu mẫu được tạo để kiểm thử OCR, trích xuất và lập chỉ mục.'
    ],
    mixed: [
      'Tài liệu hỗn hợp bao gồm văn bản, hình ảnh, bảng và nhiều kiểu bố cục khác nhau để mô phỏng dữ liệu thực tế.',
      'Mục tiêu là kiểm thử tải lên, xem trước, OCR, lưu trữ, CDN và các luồng xử lý PDF.'
    ]
  };

  // Nội dung nâng cao được đưa thẳng vào từng trang PDF.
  window.autoText = function (page) {
    const type = $('#docTemplate')?.value || 'report';
    const arr = templateText[type] || templateText.mixed;
    const density = $('#textDensity')?.value || 'medium';
    let count = { low: 1, medium: 2, high: 4 }[density] || 2;
    if ($('#edgeTextHeavy')?.checked) count = 8;
    const out = [];
    for (let i = 0; i < count; i++) out.push(arr[(page + i) % arr.length]);
    const tableMode = $('#tableMode')?.value || 'none';
    const every = { low: 5, medium: 3, high: 2 }[tableMode];
    if (every && page % every === 0) {
      out.push('BẢNG DỮ LIỆU: STT | Sản phẩm | Số lượng | Đơn giá | Thành tiền. 1 | Gói kiểm thử A | 2 | 125000 | 250000. 2 | Gói kiểm thử B | 1 | 320000 | 320000.');
    }
    if ($('#edgeSpecial')?.checked) out.push('Ký tự kiểm thử: !@#$%^&*()_+-=[]{};:,.?/\\ <> ~ 0123456789 ABC xyz.');
    return out.join(' ');
  };

  window.layoutFor = function (page, hasImage) {
    const chosen = $('#layoutMode')?.value || 'random';
    if (chosen !== 'random') return chosen;
    if (!hasImage) return 'text-only';
    const r = rng(page + 17)();
    const layouts = ['text-image', 'image-text', 'text-only', 'text-image'];
    return layouts[Math.floor(r * layouts.length)];
  };

  // Luôn xử lý ảnh theo chế độ scan tại thời điểm TẠO PDF, kể cả người dùng đổi scan sau khi đã upload ảnh.
  async function transformImageObject(im, mode, index) {
    if (!im || !im.url || mode === 'none') return;
    try {
      const srcBlob = await fetch(im.url).then(r => r.blob());
      const bmp = await createImageBitmap(srcBlob);
      const max = $('#edgeHugeImage')?.checked ? 3200 : 1800;
      const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * s));
      const h = Math.max(1, Math.round(bmp.height * s));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      const localMode = mode === 'mixed' ? (rng(index + 911)() > .5 ? 'soft' : 'gray') : mode;
      ctx.filter = localMode === 'gray' ? 'grayscale(1) contrast(.95)' : localMode === 'bad' ? 'grayscale(1) contrast(.76) brightness(1.08) blur(.7px)' : 'grayscale(.65) contrast(.9)';
      const angle = localMode === 'bad' ? (rng(index + 1217)() - .5) * .06 : 0;
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(angle); ctx.drawImage(bmp, -w / 2, -h / 2, w, h); ctx.restore();
      ctx.filter = 'none';
      if (localMode === 'bad') {
        const rr = rng(index + 2222); ctx.globalAlpha = .09;
        for (let i = 0; i < 1000; i++) { ctx.fillStyle = rr() > .5 ? '#000' : '#fff'; ctx.fillRect(rr() * w, rr() * h, 1 + rr() * 2, 1 + rr() * 2); }
        ctx.globalAlpha = 1;
      }
      bmp.close();
      const quality = localMode === 'bad' ? .46 : Math.max(.5, Number($('#imageQuality')?.value || 82) / 100);
      const blob = await new Promise(resolve => c.toBlob(resolve, 'image/jpeg', quality));
      im.bytes = new Uint8Array(await blob.arrayBuffer()); im.width = w; im.height = h;
    } catch (e) { console.warn('Không thể áp dụng chế độ bản quét cho ảnh', e); }
  }

  async function applyScanToCurrentImages() {
    const mode = $('#scanMode')?.value || 'none';
    if (typeof images === 'undefined' || !Array.isArray(images) || !images.length || mode === 'none') return;
    for (let i = 0; i < images.length; i++) await transformImageObject(images[i], mode, i);
  }

  // Khi upload ảnh mới, chế độ scan cũng được áp dụng ngay.
  if (original.fileToJpeg) {
    window.fileToJpeg = async function (file) {
      const base = await original.fileToJpeg(file);
      const mode = $('#scanMode')?.value || 'none';
      if (mode !== 'none') await transformImageObject(base, mode, seedValue(file.size));
      return base;
    };
  }

  function rebuildPdf(partsWithoutTail) {
    const header = partsWithoutTail[0];
    const parts = [header];
    const offsets = [0];
    let len = header.length, maxObj = 0;
    for (let i = 1; i < partsWithoutTail.length; i++) {
      const p = partsWithoutTail[i];
      const match = dec.decode(p.slice(0, 48)).match(/(\d+) 0 obj/);
      if (match) { const n = Number(match[1]); maxObj = Math.max(maxObj, n); offsets[n] = len; }
      parts.push(p); len += p.length;
    }
    const xrefAt = len;
    let xref = `xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`;
    for (let n = 1; n <= maxObj; n++) xref += `${String(offsets[n] || 0).padStart(10, '0')} 00000 n \n`;
    const tail = enc.encode(xref + `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);
    parts.push(tail);
    return { parts, baseSize: len + tail.length };
  }

  // Đây là điểm quan trọng: buildPdf chính được thay thế bằng buildPdf có áp dụng toàn bộ tùy chọn nâng cao.
  if (original.buildPdf) {
    window.buildPdf = async function (pageCount, fileName) {
      await applyScanToCurrentImages();
      const result = await original.buildPdf(pageCount, fileName);
      const headerText = $('#qaHeader')?.value.trim() || '';
      const footerText = $('#qaFooter')?.value.trim() || '';
      const watermarkText = $('#qaWatermark')?.value.trim() || '';
      const needsPost = headerText || footerText || watermarkText || $('#edgeBlank')?.checked || $('#edgeRotate')?.checked || $('#edgeMixedSize')?.checked;
      if (!needsPost) return result;

      const raw = result.parts.slice(0, -1);
      let pageIndex = 0, contentIndex = 0;
      const dims = typeof pageDims === 'function' ? pageDims() : { w: 595.28, h: 841.89 };
      const modified = raw.map((part, idx) => {
        if (idx === 0) return part;
        let s;
        try { s = dec.decode(part); } catch (_) { return part; }

        if (/\/Type \/Page\b/.test(s)) {
          const pi = pageIndex++;
          if ($('#edgeRotate')?.checked && pi % 7 === 3 && !/\/Rotate\s/.test(s)) s = s.replace('/MediaBox', '/Rotate 90 /MediaBox');
          if ($('#edgeMixedSize')?.checked && pi % 5 === 4) s = s.replace(/\/MediaBox \[0 0 [^\]]+\]/, '/MediaBox [0 0 612 792]');
          return enc.encode(s);
        }

        if (!/stream\n/.test(s) || /DCTDecode/.test(s)) return part;
        const pi = contentIndex++;
        const m = s.match(/\/Length (\d+) >>\nstream\n([\s\S]*?)endstream/);
        if (!m) return part;
        if ($('#edgeBlank')?.checked && pi % 11 === 7) {
          const blank = s.replace(m[0], '/Length 0 >>\nstream\nendstream');
          return enc.encode(blank);
        }

        let extra = '';
        if (headerText) extra += `BT\n/F1 8 Tf\n44 ${(dims.h - 24).toFixed(0)} Td\n(${asciiPdf(headerText)}) Tj\nET\n`;
        if (footerText) extra += `BT\n/F1 8 Tf\n44 14 Td\n(${asciiPdf(footerText)}) Tj\nET\n`;
        if (watermarkText) extra += `q\n0.82 g\nBT\n/F1 34 Tf\n${Math.max(80, dims.w * .22).toFixed(0)} ${(dims.h * .5).toFixed(0)} Td\n(${asciiPdf(watermarkText)}) Tj\nET\nQ\n`;
        if (!extra) return part;
        const body = m[2] + extra;
        s = s.replace(m[0], `/Length ${enc.encode(body).length} >>\nstream\n${body}endstream`);
        return enc.encode(s);
      });
      return rebuildPdf(modified);
    };
  }

  // Dung lượng theo khoảng cũng được áp dụng vào file PDF chính.
  if (original.targetBytes) {
    window.targetBytes = function () {
      if ($('#sizeMode')?.value !== 'range') return original.targetBytes();
      const min = Math.max(1, Number($('#sizeMin')?.value || 20));
      const max = Math.max(min, Number($('#sizeMax')?.value || 100));
      const r = rng(31337)();
      return Math.round((min + r * (max - min)) * 1024 * 1024);
    };
  }

  function dispatch(el) { el?.dispatchEvent(new Event('input', { bubbles: true })); el?.dispatchEvent(new Event('change', { bubbles: true })); }
  function setValue(id, value) { const el = $('#' + id); if (el) { el.value = value; dispatch(el); } }
  function setCheck(id, value) { const el = $('#' + id); if (el) { el.checked = !!value; dispatch(el); } }

  const presets = {
    small() { setValue('targetSize', 5); setValue('sizeUnit', 'mib'); setValue('pageCount', 5); },
    large() { setValue('targetSize', 300); setValue('sizeUnit', 'mib'); setValue('pageCount', 20); },
    huge() { setValue('targetSize', 1); setValue('sizeUnit', 'gib'); setValue('pageCount', 50); },
    ocr() { setValue('scanMode', 'bad'); setValue('docTemplate', 'form'); setValue('tableMode', 'medium'); setCheck('edgeRotate', true); },
    image() { setValue('layoutMode', 'image-text'); setCheck('edgeHugeImage', true); setValue('imageQuality', 95); },
    text() { setValue('textDensity', 'high'); setCheck('edgeTextHeavy', true); setValue('layoutMode', 'text-only'); },
    mixed() { setValue('docTemplate', 'mixed'); setValue('layoutMode', 'random'); setValue('tableMode', 'medium'); setValue('scanMode', 'mixed'); },
    unicode() { setCheck('edgeSpecial', true); setValue('docTemplate', 'mixed'); }
  };
  $$('.qa-presets [data-preset]').forEach(btn => btn.addEventListener('click', () => presets[btn.dataset.preset]?.()));

  $('#sizeMode')?.addEventListener('change', () => $('#sizeRangeRow')?.classList.toggle('qa-hidden', $('#sizeMode').value !== 'range'));

  $('#testProfile')?.addEventListener('change', e => {
    const v = e.target.value;
    if (v === 'upload') { setValue('targetSize', 300); setValue('sizeUnit', 'mib'); setValue('pageCount', 30); setValue('docTemplate', 'mixed'); }
    if (v === 'ocr') { presets.ocr(); setValue('pageCount', 40); }
    if (v === 'viewer') { setValue('pageCount', 250); setCheck('edgeRotate', true); setCheck('edgeMixedSize', true); setValue('layoutMode', 'random'); }
    if (v === 'storage') { setValue('targetSize', 1); setValue('sizeUnit', 'gib'); setValue('pageCount', 50); }
  });

  $('#randomizeBtn')?.addEventListener('click', () => {
    const r = rng(Date.now() & 0xffff);
    const pick = a => a[Math.floor(r() * a.length)];
    setValue('docTemplate', pick(['report','contract','invoice','cv','catalog','form','mixed']));
    setValue('scanMode', pick(['none','gray','soft','bad','mixed']));
    setValue('tableMode', pick(['none','low','medium','high']));
    setValue('layoutMode', pick(['random','text-image','image-text','text-only']));
    setCheck('edgeBlank', r() > .7); setCheck('edgeRotate', r() > .7); setCheck('edgeMixedSize', r() > .75); setCheck('edgeTextHeavy', r() > .7); setCheck('edgeSpecial', r() > .7);
  });

  function updateRam() {
    const bytes = original.targetBytes ? original.targetBytes() : 300 * 1024 * 1024;
    const imgCount = Number($('#metricImages')?.textContent || 0);
    const scanFactor = ($('#scanMode')?.value || 'none') === 'none' ? 1 : 1.25;
    const est = bytes * (1.2 + Math.min(.55, imgCount * .035)) * scanFactor;
    const low = Math.round(est / 1024 / 1024), high = Math.round(low * 1.3);
    const out = $('#ramEstimate'), warn = $('#ramWarning');
    if (out) out.textContent = `~${low.toLocaleString()}–${high.toLocaleString()} MB`;
    if (warn) warn.textContent = high > 1800 ? 'Nguy cơ trình duyệt hết RAM' : high > 900 ? 'Nên đóng bớt các tab nặng' : 'An toàn trên đa số máy tính';
  }
  panel.addEventListener('input', updateRam); panel.addEventListener('change', updateRam); updateRam();

  // ZIP không nén, phù hợp file PDF lớn và tránh nhân đôi CPU/RAM do nén lại dữ liệu đã nặng.
  function crc32(bytes) {
    let crc = -1;
    for (let i = 0; i < bytes.length; i++) { crc ^= bytes[i]; for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1)); }
    return (crc ^ -1) >>> 0;
  }
  function le16(n) { return new Uint8Array([n & 255, (n >>> 8) & 255]); }
  function le32(n) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]); }
  function join(parts) { const len = parts.reduce((a,p)=>a+p.length,0), out = new Uint8Array(len); let at=0; for(const p of parts){out.set(p,at);at+=p.length;} return out; }

  async function pdfBlobFor(index, target) {
    const pages = Math.max(1, Math.min(1000, Number($('#pageCount')?.value || 20)));
    const baseName = ($('#fileName')?.value || 'test-pdf').replace(/\.pdf$/i, '');
    const built = await window.buildPdf(pages, `${baseName}-${index + 1}.pdf`);
    if (built.baseSize > target) throw new Error(`Nội dung PDF #${index + 1} đã lớn hơn dung lượng mục tiêu.`);
    const parts = built.parts.slice(); let remain = target - built.baseSize;
    const zero = new Uint8Array(8 * 1024 * 1024);
    while (remain > 0) { const n = Math.min(remain, zero.length); parts.push(n === zero.length ? zero : new Uint8Array(n)); remain -= n; }
    return new Blob(parts, { type: 'application/pdf' });
  }

  $('#batchBtn')?.addEventListener('click', async () => {
    const btn = $('#batchBtn'); const count = Math.max(1, Math.min(50, Number($('#batchCount')?.value || 5)));
    const baseName = ($('#fileName')?.value || 'test-pdf').replace(/\.pdf$/i, '');
    btn.disabled = true; btn.textContent = 'Đang tạo nhiều PDF...';
    try {
      const files = [];
      for (let i = 0; i < count; i++) {
        let target;
        if ($('#sizeMode')?.value === 'range') {
          const min = Math.max(1, Number($('#sizeMin')?.value || 20)), max = Math.max(min, Number($('#sizeMax')?.value || 100));
          target = Math.round((min + rng(50000 + i)() * (max - min)) * 1024 * 1024);
        } else target = original.targetBytes ? original.targetBytes() : 300 * 1024 * 1024;
        const blob = await pdfBlobFor(i, target); files.push({ name: `${baseName}-${i + 1}.pdf`, bytes: new Uint8Array(await blob.arrayBuffer()) });
        btn.textContent = `Đang tạo ${i + 1}/${count} PDF...`;
      }
      const local=[], central=[]; let offset=0;
      for (const f of files) {
        const name=enc.encode(f.name), crc=crc32(f.bytes), size=f.bytes.length;
        const lh=join([le32(0x04034b50),le16(20),le16(0),le16(0),le16(0),le16(0),le32(crc),le32(size),le32(size),le16(name.length),le16(0),name,f.bytes]);
        local.push(lh);
        central.push(join([le32(0x02014b50),le16(20),le16(20),le16(0),le16(0),le16(0),le16(0),le32(crc),le32(size),le32(size),le16(name.length),le16(0),le16(0),le16(0),le16(0),le32(0),le32(offset),name]));
        offset += lh.length;
      }
      const centralSize=central.reduce((a,p)=>a+p.length,0), end=join([le32(0x06054b50),le16(0),le16(0),le16(files.length),le16(files.length),le32(centralSize),le32(offset),le16(0)]);
      const zip=new Blob([...local,...central,end],{type:'application/zip'}), a=document.createElement('a'); a.href=URL.createObjectURL(zip); a.download=`${baseName}-batch.zip`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),5000);
    } catch(e) { alert(e.message || String(e)); }
    finally { btn.disabled=false; btn.textContent='Tạo nhiều PDF và tải ZIP'; }
  });
})();
