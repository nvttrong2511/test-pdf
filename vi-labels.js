// Việt hóa các nhãn còn sót lại trong giao diện.
(function () {
  function vietHoa() {
    document.querySelectorAll('.qa-panel .section-title h2').forEach(function (el) {
      if (el.textContent.trim() === 'QA / Test Data nâng cao') {
        el.textContent = 'Công cụ kiểm thử nâng cao';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', vietHoa);
  } else {
    vietHoa();
  }
})();
