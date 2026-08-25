// Bản vá nội dung tiếng Việt + bố cục luôn hiển thị chữ khi dùng ảnh.
(function () {
  const MAU_VAN_BAN = [
    'Tài liệu này được tạo tự động để phục vụ việc kiểm thử tải lên, lưu trữ, xem trước và đo hiệu năng xử lý PDF. Nội dung được bố trí xen kẽ giữa văn bản và hình ảnh để mô phỏng tài liệu thực tế.',
    'Các tệp dung lượng lớn giúp kiểm tra giới hạn tải lên, thời gian chờ, CDN, bộ nhớ đệm, dung lượng lưu trữ và khả năng xử lý nền. Mỗi trang có thể bao gồm tiêu đề, đoạn mô tả, hình ảnh, chú thích và số trang.',
    'Nội dung trong tài liệu hoàn toàn là dữ liệu mẫu. Mục đích là tạo ra một tệp PDF có cấu trúc gần giống tài liệu thật mà không cần gửi hình ảnh hoặc dữ liệu cá nhân lên máy chủ.',
    'Khi kiểm thử hệ thống tài liệu, bố cục thực tế thường phát hiện được nhiều vấn đề hơn so với tệp trắng. Văn bản và hình ảnh hỗn hợp giúp kiểm tra khả năng render, tạo thumbnail, OCR, lập chỉ mục và chuyển đổi định dạng.',
    'Hiệu năng tạo tệp phụ thuộc vào trình duyệt và cấu hình thiết bị. Với các tệp rất lớn, nên đóng bớt các tab nặng để giảm mức sử dụng bộ nhớ trong quá trình tạo PDF.'
  ];

  window.autoText = function (page) {
    const density = document.querySelector('#textDensity')?.value || 'medium';
    const count = { low: 1, medium: 2, high: 4 }[density] || 2;
    const parts = [];
    for (let i = 0; i < count; i++) parts.push(MAU_VAN_BAN[(page + i) % MAU_VAN_BAN.length]);
    return parts.join(' ');
  };

  window.pageText = function (page) {
    const mode = document.querySelector('#textMode')?.value || 'auto';
    if (mode === 'none') return '';
    if (mode === 'custom') {
      const value = document.querySelector('#customText')?.value.trim();
      return value || window.autoText(page);
    }
    return window.autoText(page);
  };

  window.layoutFor = function (page, hasImage) {
    const textMode = document.querySelector('#textMode')?.value || 'auto';
    const layoutMode = document.querySelector('#layoutMode')?.value || 'random';
    if (!hasImage) return 'text-only';
    if (layoutMode !== 'random') return layoutMode;
    if (textMode === 'none') return 'full-image';
    const mixed = ['text-image', 'image-text', 'text-image', 'text-only'];
    return mixed[page % mixed.length];
  };

  const repaint = () => {
    try { if (typeof window.drawPreview === 'function') window.drawPreview(); } catch (_) {}
  };

  ['textMode', 'textDensity', 'layoutMode', 'customText', 'showCaption', 'showPageNumber', 'showHeading']
    .forEach(id => document.getElementById(id)?.addEventListener(id === 'customText' ? 'input' : 'change', repaint));

  document.querySelectorAll('input[name="imageMode"]').forEach(el => el.addEventListener('change', repaint));
  setTimeout(repaint, 0);
})();
