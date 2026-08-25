// Bản vá tiếng Việt + xem trước nhiều trang + thumbnail.
(function () {
  const MAU_VAN_BAN = [
    'Tài liệu này được tạo tự động để phục vụ việc kiểm thử tải lên, lưu trữ, xem trước và đo hiệu năng xử lý PDF. Nội dung được bố trí xen kẽ giữa văn bản và hình ảnh để mô phỏng tài liệu thực tế.',
    'Các tệp dung lượng lớn giúp kiểm tra giới hạn tải lên, thời gian chờ, CDN, bộ nhớ đệm, dung lượng lưu trữ và khả năng xử lý nền. Mỗi trang có thể bao gồm tiêu đề, đoạn mô tả, hình ảnh, chú thích và số trang.',
    'Nội dung trong tài liệu hoàn toàn là dữ liệu mẫu. Mục đích là tạo ra một tệp PDF có cấu trúc gần giống tài liệu thật mà không cần gửi hình ảnh hoặc dữ liệu cá nhân lên máy chủ.',
    'Khi kiểm thử hệ thống tài liệu, bố cục thực tế thường phát hiện được nhiều vấn đề hơn so với tệp trắng. Văn bản và hình ảnh hỗn hợp giúp kiểm tra khả năng render, tạo thumbnail, OCR, lập chỉ mục và chuyển đổi định dạng.',
    'Hiệu năng tạo tệp phụ thuộc vào trình duyệt và cấu hình thiết bị. Với các tệp rất lớn, nên đóng bớt các tab nặng để giảm mức sử dụng bộ nhớ trong quá trình tạo PDF.'
  ];

  const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792], legal: [612, 1008] };
  let currentPage = 0;

  function pageCount() {
    return Math.max(1, Math.min(1000, Number(document.querySelector('#pageCount')?.value) || 1));
  }

  function pageDims() {
    let [w, h] = PAGE_SIZES[document.querySelector('#pageSize')?.value || 'a4'] || PAGE_SIZES.a4;
    if ((document.querySelector('#orientation')?.value || 'portrait') === 'landscape') [w, h] = [h, w];
    return { w, h };
  }

  function imageElements() {
    return [...document.querySelectorAll('#previewList .preview img')];
  }

  function autoText(page) {
    const density = document.querySelector('#textDensity')?.value || 'medium';
    const count = { low: 1, medium: 2, high: 4 }[density] || 2;
    const parts = [];
    for (let i = 0; i < count; i++) parts.push(MAU_VAN_BAN[(page + i) % MAU_VAN_BAN.length]);
    return parts.join(' ');
  }

  function pageText(page) {
    const mode = document.querySelector('#textMode')?.value || 'auto';
    if (mode === 'none') return '';
    if (mode === 'custom') {
      const value = document.querySelector('#customText')?.value.trim();
      return value || autoText(page);
    }
    return autoText(page);
  }

  function layoutFor(page, hasImage) {
    const textMode = document.querySelector('#textMode')?.value || 'auto';
    const layoutMode = document.querySelector('#layoutMode')?.value || 'random';
    if (!hasImage) return 'text-only';
    if (layoutMode !== 'random') return layoutMode;
    if (textMode === 'none') return 'full-image';
    const mixed = ['text-image', 'image-text', 'text-image', 'text-only'];
    return mixed[page % mixed.length];
  }

  // Ghi đè các hàm global cũ để phần tạo PDF và preview dùng cùng logic.
  window.autoText = autoText;
  window.pageText = pageText;
  window.layoutFor = layoutFor;

  function wrapCanvasText(ctx, text, maxWidth, maxLines) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
        if (lines.length >= maxLines) break;
      } else {
        line = next;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    return lines;
  }

  function drawImageContain(ctx, img, x, y, w, h, mode) {
    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;
    let dw = w, dh = h, dx = x, dy = y;
    if (mode !== 'stretch') {
      const ratio = mode === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
      dw = iw * ratio;
      dh = ih * ratio;
      dx = x + (w - dw) / 2;
      dy = y + (h - dh) / 2;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  function renderPage(canvas, pageIndex, thumbnail = false) {
    const ctx = canvas.getContext('2d');
    const { w: pw, h: ph } = pageDims();
    const maxW = thumbnail ? 60 : 420;
    const maxH = thumbnail ? 84 : 594;
    const scale = Math.min(maxW / pw, maxH / ph);
    canvas.width = Math.max(1, Math.round(pw * scale));
    canvas.height = Math.max(1, Math.round(ph * scale));

    const W = canvas.width, H = canvas.height;
    const margin = Math.max(4, 28 * scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const imgs = imageElements();
    const imgEl = imgs.length ? imgs[pageIndex % imgs.length] : null;
    const layout = layoutFor(pageIndex, !!imgEl);
    const text = pageText(pageIndex);
    const showHeading = document.querySelector('#showHeading')?.checked !== false;
    const showCaption = document.querySelector('#showCaption')?.checked !== false;
    const showPageNumber = document.querySelector('#showPageNumber')?.checked !== false;
    const imageMode = document.querySelector('input[name="imageMode"]:checked')?.value || 'cover';

    const drawTextBlock = (top, height) => {
      if (!text || height <= 0) return;
      const headingSize = Math.max(thumbnail ? 3 : 11, 20 * scale);
      const bodySize = Math.max(thumbnail ? 2.5 : 8, 11 * scale);
      let y = top;
      if (showHeading) {
        ctx.fillStyle = '#151922';
        ctx.font = `700 ${headingSize}px system-ui`;
        ctx.fillText(`Tài liệu kiểm thử - Mục ${pageIndex + 1}`, margin, y + headingSize);
        y += headingSize + Math.max(3, 12 * scale);
      }
      ctx.fillStyle = '#566171';
      ctx.font = `${bodySize}px system-ui`;
      const leading = bodySize * 1.45;
      const maxLines = Math.max(1, Math.floor((top + height - y) / leading));
      const lines = wrapCanvasText(ctx, text, W - margin * 2, maxLines);
      for (const line of lines) {
        y += leading;
        ctx.fillText(line, margin, y);
      }
    };

    const drawImg = (x, y, w, h) => {
      if (!imgEl || w <= 0 || h <= 0) return;
      drawImageContain(ctx, imgEl, x, y, w, h, imageMode);
      if (showCaption && !thumbnail) {
        ctx.fillStyle = '#738094';
        ctx.font = `${Math.max(8, 10 * scale)}px system-ui`;
        ctx.fillText(`Hình ${pageIndex + 1}. Ảnh mẫu đã tải lên`, x, Math.min(H - margin, y + h + 13 * scale));
      }
    };

    const usableH = H - margin * 2 - (showPageNumber ? 14 * scale : 0);
    if (layout === 'full-image' && imgEl) {
      drawImg(margin, margin, W - margin * 2, usableH);
    } else if (layout === 'text-only' || !imgEl) {
      drawTextBlock(margin, usableH);
    } else if (layout === 'image-text') {
      const imageH = usableH * 0.48;
      drawImg(margin, margin, W - margin * 2, imageH);
      drawTextBlock(margin + imageH + Math.max(5, 28 * scale), usableH - imageH - Math.max(5, 28 * scale));
    } else {
      const textH = usableH * 0.42;
      drawTextBlock(margin, textH);
      drawImg(margin, margin + textH + Math.max(3, 8 * scale), W - margin * 2, usableH - textH - Math.max(5, 24 * scale));
    }

    if (showPageNumber) {
      ctx.fillStyle = '#7c8798';
      ctx.font = `${Math.max(thumbnail ? 2.5 : 8, 10 * scale)}px system-ui`;
      const label = `${pageIndex + 1} / ${pageCount()}`;
      const tw = ctx.measureText(label).width;
      ctx.fillText(label, W - margin - tw, H - Math.max(3, 8 * scale));
    }
  }

  function renderThumbnails() {
    const wrap = document.querySelector('#previewThumbnails');
    if (!wrap) return;
    wrap.innerHTML = '';
    const total = pageCount();
    // Với tài liệu rất nhiều trang, chỉ render một cửa sổ quanh trang hiện tại để tránh tốn RAM.
    const maxThumbs = 30;
    let start = 0, end = total;
    if (total > maxThumbs) {
      start = Math.max(0, Math.min(currentPage - Math.floor(maxThumbs / 2), total - maxThumbs));
      end = start + maxThumbs;
      if (start > 0) {
        const more = document.createElement('div');
        more.className = 'thumb-more';
        more.textContent = `+ ${start} trang trước`;
        wrap.appendChild(more);
      }
    }

    for (let i = start; i < end; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `preview-thumb${i === currentPage ? ' active' : ''}`;
      btn.dataset.page = String(i + 1);
      const canvas = document.createElement('canvas');
      const label = document.createElement('span');
      label.textContent = `Trang ${i + 1}`;
      btn.append(canvas, label);
      btn.addEventListener('click', () => setPage(i));
      wrap.appendChild(btn);
      renderPage(canvas, i, true);
    }

    if (end < total) {
      const more = document.createElement('div');
      more.className = 'thumb-more';
      more.textContent = `+ ${total - end} trang sau`;
      wrap.appendChild(more);
    }

    requestAnimationFrame(() => wrap.querySelector('.preview-thumb.active')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }));
  }

  function syncControls() {
    const total = pageCount();
    if (currentPage >= total) currentPage = total - 1;
    if (currentPage < 0) currentPage = 0;
    const tag = document.querySelector('#previewTag');
    const input = document.querySelector('#previewPageInput');
    const totalEl = document.querySelector('#previewTotal');
    const prev = document.querySelector('#previewPrev');
    const next = document.querySelector('#previewNext');
    if (tag) tag.textContent = `Trang ${currentPage + 1} / ${total}`;
    if (input) { input.value = String(currentPage + 1); input.max = String(total); }
    if (totalEl) totalEl.textContent = `/ ${total}`;
    if (prev) prev.disabled = currentPage <= 0;
    if (next) next.disabled = currentPage >= total - 1;
  }

  function repaint(rebuildThumbs = true) {
    syncControls();
    const canvas = document.querySelector('#pagePreview');
    if (canvas) renderPage(canvas, currentPage, false);
    if (rebuildThumbs) renderThumbnails();
  }

  function setPage(index) {
    currentPage = Math.max(0, Math.min(pageCount() - 1, index));
    repaint(true);
  }

  // Ghi đè preview cũ để mọi thay đổi của app đều render đúng trang đang chọn.
  window.drawPreview = function () { repaint(true); };

  document.querySelector('#previewPrev')?.addEventListener('click', () => setPage(currentPage - 1));
  document.querySelector('#previewNext')?.addEventListener('click', () => setPage(currentPage + 1));
  document.querySelector('#previewPageInput')?.addEventListener('change', (e) => setPage((Number(e.target.value) || 1) - 1));
  document.querySelector('#previewPageInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') setPage((Number(e.currentTarget.value) || 1) - 1);
  });

  const watched = ['pageCount', 'pageSize', 'orientation', 'textMode', 'textDensity', 'layoutMode', 'customText', 'showCaption', 'showPageNumber', 'showHeading'];
  watched.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(id === 'customText' || id === 'pageCount' ? 'input' : 'change', () => repaint(true));
  });
  document.querySelectorAll('input[name="imageMode"]').forEach(el => el.addEventListener('change', () => repaint(true)));

  // Theo dõi danh sách ảnh vì app.js thêm/xóa/sắp xếp ảnh ngoài phạm vi patch này.
  const imageList = document.querySelector('#previewList');
  if (imageList) {
    new MutationObserver(() => repaint(true)).observe(imageList, { childList: true, subtree: true });
  }

  setTimeout(() => repaint(true), 0);
})();
