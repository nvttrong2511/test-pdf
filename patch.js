// Mixed-content behavior patch: when text is enabled, Random mix always keeps text visible.
(function () {
  const originalLayoutFor = window.layoutFor;

  window.layoutFor = function (page, hasImage) {
    const textMode = document.querySelector('#textMode')?.value || 'auto';
    const layoutMode = document.querySelector('#layoutMode')?.value || 'random';

    if (!hasImage) return 'text-only';
    if (layoutMode !== 'random') return layoutMode;

    // If text is disabled, image-only pages are expected.
    if (textMode === 'none') return 'full-image';

    // Keep text visible on every mixed-content page.
    const mixed = ['text-image', 'image-text', 'text-image', 'text-only'];
    return mixed[page % mixed.length];
  };

  // Repaint after the patch is installed and whenever content controls change.
  const repaint = () => {
    try { if (typeof window.drawPreview === 'function') window.drawPreview(); } catch (_) {}
  };

  ['textMode', 'textDensity', 'layoutMode', 'showCaption', 'showPageNumber', 'showHeading']
    .forEach(id => document.getElementById(id)?.addEventListener('change', repaint));

  document.querySelectorAll('input[name="imageMode"]').forEach(el => el.addEventListener('change', repaint));
  setTimeout(repaint, 0);
})();
