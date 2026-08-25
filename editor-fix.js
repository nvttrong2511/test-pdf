// Bảo đảm luôn có rich editor khi chọn "Nội dung tùy chỉnh", kể cả Quill/CDN không khởi tạo được.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const textMode = $('#textMode');
  const oldWrap = $('#customTextWrap');
  const oldText = $('#customText');
  if (!textMode || !oldWrap) return;

  let wrap = $('.rich-editor-wrap');
  let nativeEditor = null;

  function createFallback() {
    if (wrap) return;
    wrap = document.createElement('div');
    wrap.className = 'rich-editor-wrap hidden native-rich-wrap';
    wrap.innerHTML = `
      <div class="rich-editor-label">
        <span>Soạn nội dung có định dạng</span>
        <small>Tiêu đề · đậm/nghiêng · danh sách · căn lề · xuống dòng</small>
      </div>
      <div class="native-toolbar" role="toolbar" aria-label="Thanh công cụ soạn thảo">
        <select id="nativeBlock" title="Kiểu đoạn">
          <option value="p">Đoạn văn</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
        </select>
        <button type="button" data-cmd="bold" title="In đậm"><b>B</b></button>
        <button type="button" data-cmd="italic" title="In nghiêng"><i>I</i></button>
        <button type="button" data-cmd="underline" title="Gạch chân"><u>U</u></button>
        <button type="button" data-cmd="insertUnorderedList" title="Danh sách">• Danh sách</button>
        <button type="button" data-cmd="insertOrderedList" title="Đánh số">1. Đánh số</button>
        <button type="button" data-cmd="justifyLeft" title="Căn trái">Trái</button>
        <button type="button" data-cmd="justifyCenter" title="Căn giữa">Giữa</button>
        <button type="button" data-cmd="justifyRight" title="Căn phải">Phải</button>
        <button type="button" id="nativeClear" title="Xóa định dạng">Xóa định dạng</button>
      </div>
      <div id="nativeRichEditor" class="native-rich-editor" contenteditable="true" spellcheck="true">
        <h1>Nội dung tài liệu</h1>
        <p>Bạn có thể chỉnh sửa nội dung, xuống dòng, tạo tiêu đề, danh sách và định dạng văn bản tại đây.</p>
        <h2>Mục kiểm thử</h2>
        <p>Nội dung này sẽ được dùng cho phần xem trước và PDF xuất ra.</p>
      </div>`;
    oldWrap.insertAdjacentElement('afterend', wrap);
    nativeEditor = $('#nativeRichEditor', wrap);

    wrap.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        nativeEditor.focus();
        document.execCommand(btn.dataset.cmd, false, null);
        sync();
      });
    });
    $('#nativeBlock', wrap)?.addEventListener('change', e => {
      nativeEditor.focus();
      document.execCommand('formatBlock', false, e.target.value);
      sync();
    });
    $('#nativeClear', wrap)?.addEventListener('click', () => {
      nativeEditor.focus();
      document.execCommand('removeFormat', false, null);
      sync();
    });
    nativeEditor.addEventListener('input', sync);
  }

  function getActiveEditorHtml() {
    const quillRoot = $('#richEditor .ql-editor');
    if (quillRoot) return quillRoot.innerHTML;
    return nativeEditor?.innerHTML || '';
  }

  function sync() {
    if (oldText) {
      const temp = document.createElement('div');
      temp.innerHTML = getActiveEditorHtml();
      oldText.value = temp.innerText;
      oldText.dispatchEvent(new Event('input', { bubbles: true }));
    }
    window.__richEditorHtml = getActiveEditorHtml();
    document.dispatchEvent(new CustomEvent('rich-editor-change', { detail: { html: window.__richEditorHtml } }));
  }

  function ensureVisible() {
    const custom = textMode.value === 'custom';
    oldWrap.classList.add('hidden');

    // Nếu Quill đã tồn tại thì ưu tiên editor Quill.
    const quillWrap = $('.rich-editor-wrap:not(.native-rich-wrap)');
    if (custom && quillWrap && $('#richEditor .ql-editor')) {
      quillWrap.classList.remove('hidden');
      if (wrap && wrap !== quillWrap) wrap.classList.add('hidden');
      window.__richEditorHtml = $('#richEditor .ql-editor').innerHTML;
      return;
    }

    if (!wrap || !wrap.classList.contains('native-rich-wrap')) {
      // rich-doc.js có thể đã tạo wrapper nhưng Quill không khởi tạo. Ẩn wrapper hỏng và tạo fallback.
      if (wrap) wrap.classList.add('hidden');
      wrap = null;
      createFallback();
    }
    wrap.classList.toggle('hidden', !custom);
    if (custom) sync();
  }

  createFallback();
  textMode.addEventListener('change', ensureVisible);
  textMode.addEventListener('input', ensureVisible);

  // Chạy lại sau các script khác để tránh bị class hidden ghi đè.
  ensureVisible();
  setTimeout(ensureVisible, 100);
  setTimeout(ensureVisible, 700);

  // Cho renderer khác lấy HTML định dạng hiện tại.
  window.getRichEditorHtml = function () {
    const quillRoot = $('#richEditor .ql-editor');
    return quillRoot ? quillRoot.innerHTML : (nativeEditor?.innerHTML || window.__richEditorHtml || '');
  };
})();
