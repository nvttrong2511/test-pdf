// Đồng bộ preview ngay khi ảnh upload/xóa/sắp xếp thay đổi.
(function () {
  const list = document.querySelector('#previewList');
  if (!list) return;

  let timer = 0;
  function refresh() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // rich-doc.js đang theo dõi layoutMode, nên phát change để render lại HTML preview.
      const layout = document.querySelector('#layoutMode');
      if (layout) layout.dispatchEvent(new Event('change', { bubbles: true }));

      // patch.js dùng drawPreview cho canvas + thumbnail.
      try {
        if (typeof window.drawPreview === 'function') window.drawPreview();
      } catch (_) {}
    }, 0);
  }

  function bindImage(img) {
    if (!img || img.dataset.previewSyncBound === '1') return;
    img.dataset.previewSyncBound = '1';
    img.addEventListener('load', refresh);
    img.addEventListener('error', refresh);
    if (img.complete) refresh();
  }

  function bindAllImages() {
    list.querySelectorAll('img').forEach(bindImage);
  }

  const observer = new MutationObserver((mutations) => {
    let changed = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList') changed = true;
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('img')) bindImage(node);
        node.querySelectorAll?.('img').forEach(bindImage);
      });
    }
    if (changed) {
      bindAllImages();
      // App xử lý file bất đồng bộ; refresh thêm một nhịp sau để chắc chắn ảnh đã vào DOM.
      refresh();
      setTimeout(refresh, 80);
    }
  });

  observer.observe(list, { childList: true, subtree: true });
  bindAllImages();

  // Khi người dùng chọn file, app.js cần thời gian chuyển ảnh sang JPEG rồi mới thêm preview.
  document.querySelector('#imageInput')?.addEventListener('change', () => {
    setTimeout(refresh, 50);
    setTimeout(refresh, 180);
  });
})();
