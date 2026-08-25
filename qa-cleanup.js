// Don gian hoa Tùy chọn kiểm thử: chỉ giữ các tùy chọn có tác dụng trực tiếp, rõ ràng lên PDF.
(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const panel = $('.qa-panel');
  if (!panel) return;

  const title = $('.section-title h2', panel);
  const meta = $('.section-title span', panel);
  if (title) title.textContent = 'Tùy chọn kiểm thử';
  if (meta) meta.textContent = 'Áp dụng trực tiếp vào PDF';

  // Không cần khối giải thích dài; tên trường phải tự nói rõ chức năng.
  $('.qa-apply-note', panel)?.remove();

  function removeControl(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const label = el.closest('label');
    if (label) label.remove();
    else el.remove();
  }

  // Các tùy chọn thừa / trùng / không cần thiết cho luồng tạo file mẫu.
  ['qaSeed', 'sizeMode', 'sizeMin', 'sizeMax', 'testProfile',
   'edgeHugeImage', 'edgeTextHeavy', 'edgeSpecial'].forEach(removeControl);

  // Dòng khoảng dung lượng không còn dùng.
  $('#sizeRangeRow', panel)?.remove();

  // Bỏ preset và kịch bản: đây chỉ là macro thay đổi các trường khác, không phải thuộc tính PDF.
  const presetRow = $('.qa-presets', panel);
  if (presetRow) {
    const subtitle = presetRow.previousElementSibling;
    if (subtitle?.classList.contains('qa-subtitle')) subtitle.remove();
    presetRow.remove();
  }

  const randomBtn = $('#randomizeBtn', panel);
  if (randomBtn) randomBtn.remove();

  // Bỏ ước tính RAM khỏi khối option; cảnh báo file lớn đã có ở khu vực Kết quả.
  $('.ram-card', panel)?.remove();

  // Dọn các hàng bị rỗng sau khi bỏ control, nhưng giữ batchBtn ẩn vì logic tạo ZIP đang dùng nó.
  const batchBtn = $('#batchBtn', panel);
  if (batchBtn) {
    batchBtn.style.display = 'none';
    batchBtn.setAttribute('aria-hidden', 'true');
  }

  panel.querySelectorAll('.three-col,.two-col,.qa-actions,.toggle-row').forEach(row => {
    const visible = [...row.children].filter(child => {
      if (child === batchBtn) return false;
      return child.nodeType === 1 && child.style.display !== 'none';
    });
    if (!visible.length && !row.contains(batchBtn)) row.remove();
  });

  // Đổi nhãn để tránh hiểu nhầm phạm vi áp dụng.
  const template = $('#docTemplate', panel);
  if (template) {
    const label = template.closest('label')?.querySelector('span');
    if (label) label.textContent = 'Mẫu nội dung (khi tự tạo)';
  }
  const table = $('#tableMode', panel);
  if (table) {
    const label = table.closest('label')?.querySelector('span');
    if (label) label.textContent = 'Bảng (nội dung tự tạo)';
  }

  // Tình huống đặc biệt chỉ còn các tùy chọn thực sự thay đổi cấu trúc trang PDF.
  const specialTitle = [...panel.querySelectorAll('.qa-subtitle')].find(el => /Tình huống kiểm thử đặc biệt/i.test(el.textContent));
  if (specialTitle) specialTitle.textContent = 'Biến thể trang';

  // Tóm tắt chỉ nêu những gì thực sự còn tồn tại trên form.
  const summary = $('#advancedApplySummary');
  if (summary) summary.textContent = 'Các tùy chọn đang chọn sẽ được áp dụng trực tiếp vào PDF.';
})();
