# Concertante credits and official logos

All logos sit directly on the plum info block (#635153). No white panel.
No CSS filters, opacity or blend modes are applied.

- `lotte-concert-hall-kr-white.svg` — LOTTE Concert Hall official Korean
  logotype (BS 1.09), White version (BS 1.06). Vector outlines extracted from
  `BI_LOTTE Concert Hall.pdf` in
  https://www.lotteconcerthall.com/down/rent/lotteconcerthall_ai.zip, fill set
  to #ffffff, original proportions (6.23:1). Replaces the venue text in the
  cover and in 장소. Displayed at 12–13px high ≈ 75–81px wide (min. 15mm).
- `seoul-emblem-silver.png` — Seoul Metropolitan Government emblem, applied
  type, silver. Unchanged official PNG from
  https://www.seoul.go.kr/upload/seoul/emblem/emblem_png.zip
  (서울특별시_엠블럼 응용형_silver.png). The CI lockups only ship with a black
  logotype, which is illegible on the dark ground; the emblem is the official
  alternative for dark backgrounds.
- `sfac-gray.png` — Seoul Foundation for Arts and Culture Korean horizontal
  signature in SFAC Gray (#BFC0C0), one of the foundation's identity colours
  (https://www.sfac.or.kr/site/SFAC_KOR/05/10502040000002018102204.jsp).
- `piaolla-gray.svg` — Piaolla mark, fill #BFC0C0 to match the SFAC gray.

## Ensemble GEM members

- `ensemble/{slug}.webp` — 15 cut-out portraits (400×500, transparent
  background, 14–33 KB each), shown in the 앙상블 GEM section grouped by part
  (1st violin 5 · 2nd violin 4 · viola 3 · cello 2 · double bass 1). 이근화 is
  marked 악장. Order follows the in-part listing in the programme note.
- Edge tones are matched to the page ground #160f10; do not place them on any
  other background. No CSS filters or opacity, the photos are used as retouched.
- Served from the same origin, so they satisfy the CSP `img-src 'self'`.
- Photo credit is not confirmed yet. A hidden `© [사진가]` placeholder
  (`data-credit-pending`) sits at the end of the members block; remove its
  `hidden` attribute once the credit is settled.
- The 800×1000 source PNGs are not deployed.
- Member names are set in the embedded Maru Buri subset (v1.000, 295 glyphs),
  which lacked 13 characters used in the names (근행김백건훈온유노채슬윤두).
  A second `@font-face` for `ConcertanteOriginalMaru` with a `unicode-range`
  limited to those code points supplies them (3.3 KB WOFF2 subset of Maru Buri
  Regular v2.000 from the `@kfonts/maruburi` npm package, vertical metrics set
  to match v1.000). Keep the TrueType hinting (`fpgm/prep/cvt`) and the same
  `gasp` table as the embedded face when rebuilding it: an unhinted subset
  renders visibly lighter and smaller than the hinted glyphs next to it on
  Windows. When adding names, check the subset covers every character, or
  extend that supplement.

## Programme note page

- `/concertante/program_note/` mirrors the printed programme (proof of
  2026-11-11): INTRODUCTION, PROGRAM, the three notes and the composer's line.
  It is a hand-written page with its own small stylesheet, on the same tokens
  as the landing page (ground #160f10, text #f3ede6 / #e8dfda / #bfb2ae, plum
  #635153, 390px column). A longer text will replace the notes later.
- The venue appears as the official LOTTE Concert Hall logotype, never set in
  type: under the date on the cover (12px high) and in 장소 (13px high), the
  same two places and sizes as the landing page.
- Its `@font-face` rules are copied verbatim from `concertante/index.html`
  (Cormorant, Maru Buri Regular and its 13-character supplement, Cinzel). Maru
  Buri is used only for 프로그램 노트 and 오정웅; check the subset before
  setting any other string in it. Everything else is Noto Serif KR / Noto Sans
  KR.
- Latin section labels on both pages (CONCERTANTE, PROGRAM, INTERMISSION,
  PROGRAM NOTE, INTRODUCTION, NOTES, FROM THE COMPOSER) are set in the embedded
  Cinzel subset (400, letter-spacing .24em), the label face of the printed
  programme. Korean role labels (첼로, 작곡·하프시코드, 연주) stay in Noto Sans
  KR 600.
- Movement names (PROGRAM on both pages): each name is its own nowrap span and
  the middle dots are drawn by `::before`, clipped at line starts, so no line
  begins or ends on a separator.
- Body text carries `font-feature-settings:"halt"` so the full-width brackets
  〈 〉 「 」 of Noto Serif KR sit on half widths next to Hangul.
