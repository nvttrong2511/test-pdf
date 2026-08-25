// Lưu pipeline PDF cơ bản trước khi nạp các tính năng kiểm thử nâng cao.
(function () {
  window.__pdfBasePipeline = {
    autoText: window.autoText,
    pageText: window.pageText,
    layoutFor: window.layoutFor,
    fileToJpeg: window.fileToJpeg,
    buildPdf: window.buildPdf,
    targetBytes: window.targetBytes
  };
})();
