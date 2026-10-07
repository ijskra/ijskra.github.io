# 오정웅 홈페이지

종이색·손글씨·오선지 디자인을 유지하는 정적 홈페이지입니다. 국문은 `/`, 영문은 `/en/`입니다. 소개·작품·연락처와 작품 펼침은 JavaScript 없이도 사용할 수 있습니다.

## 콘텐츠 수정

1. `data/*.json`에서 소개, 작품, 공연, 연구, 소식을 수정합니다.
2. Node.js 20 이상에서 `npm run build`를 실행합니다. 별도의 패키지 설치는 필요 없습니다.
3. `npm test`와 `npm run test:content`를 실행합니다.
4. 수정한 JSON과 생성된 `index.html`, `en/index.html`을 함께 커밋합니다. GitHub Pages의 기존 루트 배포 방식을 그대로 사용할 수 있습니다.

`src/component.html`은 기존 콘텐츠 변환 규칙을 보존한 빌드 입력입니다. 브라우저에서 실행하지 않습니다. 페이지의 HTML 조립은 `scripts/build.cjs`, 반응형 배치는 `assets/site.css`, 선택적 상호작용은 `assets/site.js`에서 관리합니다. `support.js`도 기존 자료로 보존하지만 페이지가 다운로드하지 않습니다.

## 이미지

`portrait-700.webp`는 기존 PNG와 동일한 RGBA 픽셀을 보존한 무손실 WebP입니다. `portrait-350.webp`는 작은 화면용입니다. 원본 PNG는 공유 미리보기용으로 유지합니다. 첫 화면 사진은 지연 로딩하지 않으며, 악보는 PC에서 작품을 펼칠 때 로딩합니다.

## 검증

- `npm test`: 생성된 HTML 콘텐츠, 메타데이터, 링크, 초기 이미지 요청, 재현 가능한 빌드, HTML 이스케이프를 검사합니다.
- `npm run test:content`: 기존 콘텐츠 변환 및 배치 계산의 회귀 검사입니다. 실제 CSS 렌더링 검사는 아닙니다.
- `npm install --no-save --package-lock=false playwright@1.51.1` 후 `npx playwright install chromium`, `npm run test:browser`: 국문·영문 320~1440px, 펼침, 내비게이션, JavaScript 비활성 상태와 스크린샷을 검사합니다.

배포 전 실제 브라우저 화면을 확인해야 합니다. 연락처의 기존 `#` CV 링크는 파일이 연결되지 않아 출력하지 않습니다.
