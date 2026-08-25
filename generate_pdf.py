from pathlib import Path

OUT = Path('test_20_pages_300mb.pdf')
TARGET_SIZE = 300 * 1024 * 1024  # 300 MiB = 314,572,800 bytes
PAGE_COUNT = 20


def build_pdf() -> bytes:
    objects = []

    # 1: Catalog
    objects.append(b'<< /Type /Catalog /Pages 2 0 R >>')

    # 2: Pages tree - filled after page objects are defined
    page_obj_nums = [3 + i * 2 for i in range(PAGE_COUNT)]
    kids = b' '.join(f'{n} 0 R'.encode() for n in page_obj_nums)
    objects.append(b'<< /Type /Pages /Count %d /Kids [ %s ] >>' % (PAGE_COUNT, kids))

    for i in range(PAGE_COUNT):
        page_num = i + 1
        page_obj = page_obj_nums[i]
        content_obj = page_obj + 1
        page = (
            f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] '
            f'/Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> '
            f'/Contents {content_obj} 0 R >>'
        ).encode()
        text = (
            'BT\n'
            '/F1 28 Tf\n'
            '72 760 Td\n'
            f'(Large PDF Test - Page {page_num} of {PAGE_COUNT}) Tj\n'
            '/F1 14 Tf\n'
            '0 -36 Td\n'
            '(Generated automatically for download/upload testing.) Tj\n'
            'ET\n'
        ).encode()
        stream = b'<< /Length %d >>\nstream\n' % len(text) + text + b'endstream'
        objects.append(page)
        objects.append(stream)

    out = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
    offsets = [0]
    for idx, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f'{idx} 0 obj\n'.encode()
        out += obj + b'\nendobj\n'

    xref_offset = len(out)
    out += f'xref\n0 {len(objects) + 1}\n'.encode()
    out += b'0000000000 65535 f \n'
    for off in offsets[1:]:
        out += f'{off:010d} 00000 n \n'.encode()

    out += (
        f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n'
        f'startxref\n{xref_offset}\n%%EOF\n'
    ).encode()
    return bytes(out)


pdf = build_pdf()
if len(pdf) >= TARGET_SIZE:
    raise RuntimeError('Base PDF unexpectedly exceeds target size')

with OUT.open('wb') as f:
    f.write(pdf)
    # PDF readers tolerate trailing bytes after %%EOF. Pad to an exact 300 MiB.
    f.write(b'\0' * (TARGET_SIZE - len(pdf)))

size = OUT.stat().st_size
print(f'Created {OUT} with {PAGE_COUNT} pages and {size:,} bytes')
assert size == TARGET_SIZE
