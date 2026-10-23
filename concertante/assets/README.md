# Concertante credits and official logos

The sponsor and venue signatures keep their official colors, proportions and
geometry. They sit on a white panel so their original wordmarks remain legible
against the plum footer. No CSS filters, opacity changes or blend modes are
applied to the logos. The selected-project and sponsor text remains above it.

- `seoul-official.png`: Seoul Metropolitan Government, original full-color
  horizontal signature, unchanged PNG pixels.
  - Source: https://www.seoul.go.kr/seoul/emblem.do
  - Package: https://www.seoul.go.kr/upload/seoul/emblem/ci_png.zip
  - Selected: 서울특별시_CI_좌우조합_서울특별시.png
- `sfac-official.png`: Seoul Foundation for Arts and Culture, official yellow
  symbol and dark gray Korean wordmark, unchanged PNG pixels.
  - Source: https://www.sfac.or.kr/site/SFAC_KOR/05/10502040000002018102204.jsp
  - Package: https://www.sfac.or.kr/down/ci_signature_png.zip
  - Selected: 서울문화재단시그니춰국문(가로형).png
- `lotte-concert-hall.svg`: official full-color primary LOTTE Concert Hall BI,
  extracted as vector outlines from `BI_LOTTE Concert Hall.pdf.pdf` in the
  venue's official package. The whole primary lockup is retained; the other
  alternative lockups on the source sheet are outside the SVG viewport.
  - Package: https://www.lotteconcerthall.com/down/rent/lotteconcerthall_ai.zip
  - Guide: `[필수]롯데콘서트홀 BI 사용 규정.pdf`, BS 1.05, 1.06 and 1.10.
  - SVG includes 26 PDF points of clearspace on every side (one wordmark
    height). At its 132 CSS-pixel display width the visible mark is about
    113 pixels wide, above the 36-pixel web minimum. The original PDF's CMYK
    colors are converted to sRGB by MuPDF when exporting the SVG.
  - Displayed separately under **공연장**, not among the funding sponsors.
- `piaolla.svg`: existing supplied Piaolla vector geometry, with its fill set
  to `#595b53` to coordinate with the official SFAC gray wordmark.

Official source packages were collected by the design-review run:
https://github.com/ijskra/ijskra.github.io/actions/runs/39929984394

The source-download step was removed after this one-time intake, keeping normal
site checks independent of third-party design-package availability.
