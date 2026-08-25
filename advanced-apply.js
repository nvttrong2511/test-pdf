// Công tắc áp dụng / bỏ qua toàn bộ công cụ kiểm thử nâng cao.
(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const panel = $('.qa-panel');
  if (!panel || !window.__pdfBasePipeline) return;

  const advancedPipeline = {
    autoText: window.autoText,
    pageText: window.pageText,
    layoutFor: window.layoutFor,
    fileToJpeg: window.fileToJpeg,
    buildPdf: window.buildPdf,
    targetBytes: window.targetBytes
  };
  const base = window.__pdfBasePipeline;

  const toggleBox = document.createElement('label');
  toggleBox.className = 'advanced-master-toggle';
  toggleBox.innerHTML = `
    <div class="advanced-master-copy">
      <strong>Áp dụng công cụ kiểm thử nâng cao vào PDF chính</strong>
      <small>Bật: các tùy chọn bên dưới sẽ được đưa vào file PDF. Tắt: tạo PDF thông thường và bỏ qua toàn bộ cấu hình nâng cao.</small>
    </div>
    <input id="applyAdvancedToPdf" type="checkbox" />`;

  const note = $('.qa-apply-note', panel);
  if (note) note.replaceWith(toggleBox);
  else $('.section-title', panel)?.insertAdjacentElement('afterend', toggleBox);

  const toggle = $('#applyAdvancedToPdf');
  const summary = $('#advancedApplySummary');

  function enabled() { return !!toggle?.checked; }

  function applyPipeline() {
    const src = enabled() ? advancedPipeline : base;
    if (src.autoText) window.autoText = src.autoText;
    if (src.pageText) window.pageText = src.pageText;
    if (src.layoutFor) window.layoutFor = src.layoutFor;
    if (src.fileToJpeg) window.fileToJpeg = src.fileToJpeg;
    if (src.buildPdf) window.buildPdf = src.buildPdf;
    if (src.targetBytes) window.targetBytes = src.targetBytes;
  }

  function updateUi() {
    const on = enabled();
    panel.classList.toggle('advanced-disabled', !on);
    panel.querySelectorAll('input,select,textarea,button').forEach(el => {
      if (el === toggle) return;
      el.disabled = !on;
    });
    if (summary) {
      summary.textContent = on
        ? 'Cấu hình kiểm thử nâng cao đang được áp dụng vào PDF chính.'
        : 'Công cụ kiểm thử nâng cao đang tắt — PDF sẽ được tạo theo cấu hình cơ bản.';
      summary.classList.toggle('advanced-off-summary', !on);
    }
    const meta = $('.section-title span', panel);
    if (meta) meta.textContent = on ? 'Đang áp dụng vào PDF chính' : 'Không áp dụng';
    applyPipeline();
    try { if (typeof window.drawPreview === 'function') window.drawPreview(); } catch (_) {}
  }

  const generateBtn = $('#generateBtn');
  generateBtn?.addEventListener('click', applyPipeline, true);
  const hiddenBatchBtn = $('#batchBtn');
  hiddenBatchBtn?.addEventListener('click', applyPipeline, true);

  toggle?.addEventListener('change', updateUi);
  updateUi();
})();
