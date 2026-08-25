// Đồng bộ Mẫu tài liệu với pipeline gốc của app.js thông qua các control mà app.js đọc trực tiếp.
(function () {
  const $ = s => document.querySelector(s);
  const panel = $('.qa-panel');
  const template = $('#docTemplate');
  const toggle = $('#applyAdvancedToPdf');
  const textMode = $('#textMode');
  const customText = $('#customText');
  const layout = $('#layoutMode');
  const density = $('#textDensity');
  if (!panel || !template || !textMode || !customText || !layout) return;

  const templates = {
    report: {
      layout: 'random', density: 'medium',
      text: 'BÁO CÁO TỔNG HỢP\n\nTài liệu báo cáo mẫu phục vụ kiểm thử hệ thống quản lý tài liệu. Nội dung bao gồm phần tổng quan, tiến độ thực hiện, các chỉ số vận hành, nhận xét và kết luận. Dữ liệu trong báo cáo là dữ liệu giả lập dùng để kiểm tra tải lên, xem trước, tìm kiếm, OCR và lưu trữ PDF.\n\nKẾT QUẢ ĐÁNH GIÁ\nCác hạng mục được tổng hợp theo từng giai đoạn nhằm mô phỏng một báo cáo doanh nghiệp thực tế. Hệ thống có thể sử dụng tài liệu này để kiểm tra thumbnail, trích xuất văn bản và hiệu năng xử lý.'
    },
    contract: {
      layout: 'text-only', density: 'high',
      text: 'HỢP ĐỒNG MẪU\n\nCăn cứ nhu cầu và sự thỏa thuận của các bên, BÊN A và BÊN B thống nhất ký kết tài liệu mẫu này. Điều 1. Phạm vi công việc. Điều 2. Trách nhiệm của các bên. Điều 3. Thời hạn thực hiện. Điều 4. Giá trị và phương thức thanh toán. Điều 5. Điều khoản chung.\n\nTài liệu này chỉ phục vụ kiểm thử phần mềm, không có giá trị pháp lý. Các tên, số liệu và điều khoản đều là dữ liệu giả lập.'
    },
    invoice: {
      layout: 'text-only', density: 'medium',
      text: 'HÓA ĐƠN MẪU\n\nMã hóa đơn: INV-TEST-2026-001\nKhách hàng: KHÁCH HÀNG KIỂM THỬ\nNgày lập: 25/08/2026\n\nSTT | Sản phẩm | Số lượng | Đơn giá | Thành tiền\n1 | Gói dịch vụ A | 2 | 125.000 | 250.000\n2 | Gói dịch vụ B | 1 | 320.000 | 320.000\n3 | Gói dịch vụ C | 4 | 85.000 | 340.000\n\nTổng cộng: 910.000 VND\nThuế và thông tin thanh toán trong tài liệu là dữ liệu giả lập.'
    },
    cv: {
      layout: 'text-image', density: 'medium',
      text: 'HỒ SƠ ỨNG VIÊN MẪU\n\nVị trí: Kỹ sư phần mềm\nKinh nghiệm: Phát triển ứng dụng web, tích hợp API, tối ưu hiệu năng và xây dựng hệ thống quản lý tài liệu.\n\nKỸ NĂNG\nJavaScript, TypeScript, HTML, CSS, REST API, cơ sở dữ liệu và kiểm thử tự động.\n\nDỰ ÁN\nCác thông tin trong hồ sơ này hoàn toàn là dữ liệu mẫu dùng để kiểm thử quy trình đọc và phân tích PDF.'
    },
    catalog: {
      layout: 'image-text', density: 'low',
      text: 'CATALOG SẢN PHẨM MẪU\n\nSản phẩm được trình bày kèm hình ảnh, mô tả, thông số kỹ thuật và nội dung giới thiệu. Bố cục ưu tiên hình ảnh để mô phỏng catalog, brochure hoặc tài liệu bán hàng thực tế.\n\nMọi thông tin trong catalog là dữ liệu giả lập phục vụ kiểm thử viewer, lưu trữ và xử lý hình ảnh trong PDF.'
    },
    form: {
      layout: 'text-only', density: 'medium',
      text: 'BIỂU MẪU KIỂM THỬ\n\nHọ và tên: ______________________________\nMã hồ sơ: _______________________________\nNgày sinh: ____ / ____ / ______\nĐịa chỉ: _________________________________\nSố điện thoại: ____________________________\nEmail: ___________________________________\n\nNội dung yêu cầu:\n__________________________________________________\n__________________________________________________\n\nChữ ký người khai: ________________________'
    },
    mixed: {
      layout: 'random', density: 'high',
      text: 'TÀI LIỆU HỖN HỢP KIỂM THỬ\n\nTài liệu này mô phỏng nhiều dạng nội dung trong cùng một PDF: báo cáo, mô tả, biểu mẫu, dữ liệu bảng, hình ảnh và các đoạn văn dài. Mục tiêu là tạo dữ liệu kiểm thử gần với tài liệu thực tế để đánh giá upload, preview, OCR, tìm kiếm, indexing, storage và CDN.\n\nSTT | Hạng mục | Trạng thái\n1 | Tải lên tài liệu | Hoàn tất\n2 | Tạo hình xem trước | Đang xử lý\n3 | OCR và lập chỉ mục | Chờ xử lý'
    }
  };

  let base = null;
  let applying = false;
  function isEnabled() { return !toggle || toggle.checked; }
  function fire(el, type='change') { el.dispatchEvent(new Event(type, { bubbles: true })); }

  function saveBase() {
    if (base) return;
    base = { textMode: textMode.value, customText: customText.value, layout: layout.value, density: density?.value || 'medium' };
  }

  function applyTemplate() {
    if (applying || !isEnabled()) return;
    const cfg = templates[template.value] || templates.report;
    saveBase();
    applying = true;
    textMode.value = 'custom';
    customText.value = cfg.text;
    layout.value = cfg.layout;
    if (density) density.value = cfg.density;
    fire(textMode);
    fire(customText, 'input');
    fire(layout);
    if (density) fire(density);
    applying = false;
  }

  function restoreBase() {
    if (!base) return;
    applying = true;
    textMode.value = base.textMode;
    customText.value = base.customText;
    layout.value = base.layout;
    if (density) density.value = base.density;
    fire(textMode);
    fire(customText, 'input');
    fire(layout);
    if (density) fire(density);
    applying = false;
  }

  template.addEventListener('change', applyTemplate);
  toggle?.addEventListener('change', () => toggle.checked ? applyTemplate() : restoreBase());

  // Nếu preset/kịch bản đổi mẫu bằng code, bắt luôn thay đổi input/change trên panel.
  panel.addEventListener('change', e => { if (e.target === template) applyTemplate(); });

  // Áp dụng ngay mẫu đang chọn ở lần tải đầu tiên.
  setTimeout(applyTemplate, 0);
})();
