# HEXy × Jelly UI v1.1

디자인·구현 시 **이 문서 + `vendor/jelly-ui/jelly.js`** 가 소스. Cursor는 `.cursor/rules/20-jelly-ui.mdc` 로 항상 읽는다.

Jelly는 dependency-free Web Component. Expo에서는 **DOM WebView** (`'use dom'`) 안에서만 그린다. Expo Go 불가.

---

## 1. 쓰는 법 (프로젝트 규칙)

```
app/** 화면
  → src/components/ui/*          RN 호스트 (크기·히트영역)
    → src/components/jelly/*.dom.tsx   'use dom' + <jelly-theme mode="dark">
      → vendor/jelly-ui/jelly.js
```

1. 새 컨트롤이 필요하면 **먼저** Jelly 태그 이름과 attrs를 이 표에서 고른다.
2. 래퍼가 없으면 `src/components/jelly/JellyX.dom.tsx`를 만든다. `loadJelly()` / `applyJellyAttrs` / `jellyDom()`.
3. `src/types/jelly-ui.d.ts`에 태그를 추가한다.
4. 화면은 `Tap`, `Field`, `Well` 같은 호스트만 import 한다.

색: `src/theme/tokens.ts` `colors` / `buttonFill()`.  
`--jelly-fill`, `--jelly-label`, `--jelly-color-foreground-on-accent`.  
variant 이름만 바꾸고 끝내지 말 것 — HEXy 버튼 역할색이 SSOT.

---

## 2. HEXy에서 쓰는 태그

| Jelly | HEXy 호스트 | 용도 |
|-------|-------------|------|
| `jelly-theme` | 모든 `*.dom.tsx` | `mode="dark"` 필수. `accent`는 hex 가능. |
| `jelly-button` | `Tap`, `CamSwitch`, `MeMark` | 모든 텍스트 액션. `size`, `shape`, `disabled`, `--jelly-fill`. |
| `jelly-input` | `Field` | 한 줄. ALBUM 검색, auth email, DM body. |
| `jelly-card` | `Well` | 표면. INBOX 행, ME 블록, CLOSE well. |
| `jelly-alert` | `AlertHost` → `JellyAlert.dom` | 토스트 대체. `tone`, `dismiss()`, 화면 탭 닫기. |

커스텀 캔버스 (Jelly 태그 아님, 같은 물리 톤):

| 파일 | 역할 |
|------|------|
| `JellyShutter.dom` | Dock 셔터 |
| `JellyActionPair.dom` | preview SAVE \| MATCH |

---

## 3. 다음에 붙일 태그 (화면이 생기면 래퍼부터)

| Jelly | HEXy 자리 | 지금 대신 쓰는 것 (교체 대상) |
|-------|-----------|-------------------------------|
| `jelly-icon-button` | BACK, 닫기, ME 아이콘 | `← BACK` MonoText, 일부 Pressable |
| `jelly-switch` | ME `매치 공개` | RN `Switch` |
| `jelly-textarea` | DM 긴 본문 | `Field` 한 줄 |
| `jelly-segmented` + `jelly-segment` | TAKE \| MATCH, ALBUM \| INBOX | `Tap` dim / `CamSwitch` |
| `jelly-tabs` + `jelly-tab-panel` | take 상세 세그먼트를 탭으로 쓸 때 | 위와 동일 |
| `jelly-chip` | 팔레트 칩, HEX 필터 | `ChipStrip` (색 막대는 유지 가능) |
| `jelly-dialog` | DELETE TAKE 확인 | 바로 삭제 |
| `jelly-menu` + `jelly-menu-item` | TAKE overflow (SHARE / DELETE) | 버튼 나열 |
| `jelly-spinner` | MATCH pending | RN `ActivityIndicator` |
| `jelly-skeleton` | ALBUM / INBOX 로딩 | `…` 텍스트 |
| `jelly-progress` | 업로드 / 동기화 | 없음 |
| `jelly-badge` | INBOX unpaid, seq | MonoText |
| `jelly-otp` | Magic Link 코드 (이메일 링크 대신 쓸 때) | 없음 |
| `jelly-checkbox` | 약관 동의 (출시 게이트) | 없음 |
| `jelly-label` | auth 필드 라벨 | placeholder=label |
| `jelly-select` + `jelly-option` | 신고 사유 | 없음 |
| `jelly-tooltip` | Δ, LOCK 설명 (짧고 영문/숫자만) | 없음 |

---

## 4. HEXy에서 쓰지 않음

제품이 로그 앱이고 피드·웹 IA가 없다.

| Jelly | 이유 |
|-------|------|
| `jelly-toaster` | `jelly-alert` + `AlertHost`가 단일 피드백 |
| `jelly-breadcrumbs` | 웹 크럼. 앱은 BACK |
| `jelly-pagination` | 페이지 나눔 없음 |
| `jelly-resizable` | 스플릿 뷰 없음 |
| `jelly-kbd` | 데스크톱 키캡 |
| `jelly-radio` / `jelly-radio-group` | 세그먼트로 충분 |
| `jelly-range` / `jelly-slider` | 듀얼/볼륨 UI 없음 (팔레트는 TakeFrame) |
| `jelly-accordion` / `jelly-collapsible` | FAQ·시적 설명 금지 |
| `jelly-drawer` | 하단 시트 대신 스택 라우트 |
| `jelly-popover` | 메뉴가 있으면 `jelly-menu` |
| `jelly-divider` | 필요 시 선 토큰 `colors.line`만. 라벨 "or" 톤 금지 |

예외가 생기면 이 표를 고친 다음 래퍼를 만든다.

---

## 5. API 치트 (v1.1)

공통 variant: `white | rose | amber | azure | mint | platinum | graphite`  
공통 size: `small | medium | large` (`sm` `md` `lg` 허용)

### jelly-theme

- `mode`: **`dark`만**. `auto`/`light` 금지.
- `accent`: 팔레트 이름 또는 CSS color. HEXy는 보통 자식에 `--jelly-fill`.
- `--jelly-color-*` 인라인 오버라이드 가능. 토큰 hex는 `colors`에서.

### jelly-button

- attrs: `disabled`, `label` (아이콘만), `type`, `shape` (`pill`\|`square`), `block`, `size`, `variant`
- 이벤트: native `click` (composed)
- CSS: `--jelly-button-height` 42/62/72, `--jelly-fill`, `--jelly-label`, `--jelly-ring`
- HEXy: 역할색은 `buttonFill('primary'|'back'|'danger'|…)` → `--jelly-fill`

### jelly-icon-button

- `label` **필수** (a11y). `shape`: `square`\|`circle`. size 40/48/56.

### jelly-input

- `value`, `placeholder`, `type`, `label`, `disabled`, `readonly`, `name`, `size`, `no-autofill`
- 이벤트: `input`, `change` (host에서 composed CustomEvent)
- 래퍼는 `onValueChange`로 RN `onChangeText`에 연결

### jelly-alert

- `tone`: `info`\|`success`\|`warning`\|`danger`
- `dismissible`, `dismiss()`, `shake()`, event `dismiss`
- HEXy: Capri / Paradise Pink 워시 (`alertTone`). 화면 탭 = dismiss.

### jelly-card

- `squish` = 버튼처럼. INBOX 행은 카드 + 바깥 Pressable 또는 squish.
- `--jelly-fill`, `--jelly-radius`

### jelly-switch

- `checked`, `change` (유저만). `--jelly-on` = `colors.btnOn`

### jelly-segmented

- children `jelly-segment`. `value`, `change`. TAKE/MATCH, ALBUM/INBOX.

### jelly-dialog

- `open`, `showModal()`, Escape/backdrop close. DELETE 확인용. 시적 본문 금지.

---

## 6. 화면 → 컨트롤

| 화면 | Jelly |
|------|-------|
| 온보딩 CAM / CITY ? | `jelly-button` |
| Auth GOOGLE / MAGIC LINK | `jelly-button` + `jelly-input` |
| CAM 권한 | `jelly-button` |
| Dock / 셔터 | 커스텀 shutter + 토글은 native. 위 버튼은 Jelly |
| LOG ALBUM/INBOX | 목표: `jelly-segmented`. 현재 `CamSwitch` |
| ALBUM 검색 | `jelly-input` |
| ME 매치 공개 | 목표: `jelly-switch` |
| preview SAVE/MATCH | `JellyActionPair` (button 페어) |
| preview BACK | 목표: `jelly-icon-button` |
| take TAKE/MATCH/SHARE | 목표: `jelly-segmented` + `jelly-button` |
| DELETE TAKE | `jelly-button` rose + 목표 `jelly-dialog` |
| OPEN FOLLOW/DM/COPY | `jelly-button` |
| INBOX 행 | `jelly-card` |
| DM SEND | `jelly-button` + `jelly-input` / `jelly-textarea` |
| Alert | `jelly-alert` |
| MATCH pending | 목표: `jelly-spinner` |

---

## 7. 디자인 금지

- RN 기본 버튼/인풋으로 “임시” UI 만들고 나중에 Jelly 씌우기.
- `mode="auto"` 로 라이트 깜빡임.
- jelly `mint`/`azure` 기본값을 HEXy 브랜드로 착각. 브랜드 hex는 `tokens.ts`.
- Alert와 Toaster 동시 사용.
- 카드/버튼 안에 시적 문장. 라벨은 `copy` / `msg`만.

---

## 8. 구현 체크

- [ ] 태그가 §2 또는 §3에 있는가. §4면 멈추고 문서부터 수정.
- [ ] `*.dom.tsx` + `jelly-theme mode="dark"`.
- [ ] attrs는 `applyJellyAttrs`.
- [ ] 색은 `colors` / `buttonFill` / `alertTone`.
- [ ] 히트영역은 RN 호스트 크기 = DOM `matchContents` 또는 고정 height (`alertConstants`, shutter frame).
- [ ] `jelly-ui.d.ts` 업데이트.
