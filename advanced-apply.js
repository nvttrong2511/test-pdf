// Tùy chọn kiểm thử là một phần cấu hình bình thường và luôn áp dụng trực tiếp vào PDF.
(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const panel = $('.qa-panel');
  if (!panel) return;

  // Bỏ hoàn toàn cơ chế bật/tắt tổng của khối kiểm thử.
  $('.advanced-master-toggle', panel)?.remove();
  panel.classList.remove('advanced-disabled');
  panel.querySelectorAll('input,select,textarea,button').forEach(el => {
    if (el.id !== 'batchBtn' || !el.classList.contains('hidden')) el.disabled = false;
  });

  const title = $('.section-title h2', panel);
  if (title) title.textContent = 'Tùy chọn kiểm thử';

  const meta = $('.section-title span', panel);
  if (meta) meta.textContent = 'Áp dụng trực tiếp vào PDF';

  let note = $('.qa-apply-note', panel);
  if (!note) {
    note = document.createElement('div');
    note.className = 'qa-apply-note';
    $('.section-title', panel)?.insertAdjacentElement('afterend', note);
  }
  note.innerHTML = '<strong>Chọn tùy chọn nào, PDF sẽ áp dụng tùy chọn đó.</strong><span>Không cần bật chế độ riêng. Bản quét, bảng, dấu chìm, trang trắng, xoay trang… đều là thuộc tính trực tiếp của file đang tạo.</span>';

  const summary = $('#advancedApplySummary');
  if (summary && /Công cụ kiểm thử nâng cao|đang tắt|không áp dụng/i.test(summary.textContent || '')) {
    summary.textContent = 'PDF sẽ dùng các tùy chọn đang được chọn trong form.';
  }
})();
