# HEXy 기획서

UI 컨트롤 스펙은 **`docs/JELLY_UI.md`** (Jelly UI v1.1). 화면을 그리거나 버튼을 추가할 때 먼저 그 문서를 연다.

> 로그 시스템. Cold, hip, numeric. Not a mood collector.
>
> 이 문서는 **제품이 되어야 하는 것**과 **지금 repo에 있는 것**을 같이 적는다.
> 상태 표기: `동작` = 로컬에서 실제로 돌아감 · `코드` = 화면/API/스키마는 있으나 연동·패키지·환경 미완 · `스텁` = 의도적으로 막힘 · `금지` = 만들지 않음 · `미정` = 아직 결정 안 함.

**작성 기준일:** 2026-09-12  
**제품명:** HEXy (`com.hexy.app`)  
**플랫폼:** Android first (Expo 57 / React Native / Supabase)  
**현재 실제 루프:** CAM 촬영 → 팔레트 추출 → 로컬 앨범 SAVE. 클라우드 MATCH / Google 로그인 / IAP는 **코드만**.

---

## 0. 한 장 요약

| 질문 | 답 |
|------|----|
| 무엇을 하는 앱인가 | 사진을 **색 5개**로 줄여 로그하고, 비슷한 색의 타인 TAKE를 **MATCH 5**로 붙인다. |
| 누구에게 | 감정 기록·피드·좋아요가 싫은 사람. 색·숫자·거리(Δ)로 말하고 싶은 사람. |
| 핵심 루프 | TAKE → SAVE/MATCH → OPEN 3 / CLOSE 2 → FOLLOW → FIRST DM ₩500 |
| 돈 | 첫 DM만 ₩500. 구독·광고·UNLOCK 경제 없음. |
| 절대 안 함 | 공개 발견 피드, 좋아요/댓글, 색 이름 NLP, CLOSE 사진 언락, 퀘스트, 지도 핀, 그룹챗 |

---

## 1. 서비스 기획

### 1.1 문제

기존 사진·소셜 앱은 다음을 강제한다.

- **얼굴·장소·캡션**이 주인공이다. 색은 필터다.
- **피드**가 기본 단위다. 내 로그가 타인의 타임라인에 노출된다.
- **감정 언어**가 기본이다. “오늘 분위기”, “무드 보드”, 색 이름.
- **매칭**은 얼굴·취향 설문·위치다. 색 거리(ΔE)가 아니다.

HEXy가 푸는 문제:

1. 순간을 **숫자·헥스·Δ**로 남기고 싶다.
2. 비슷한 색을 찍은 사람을 찾고 싶지만, **원본 사진을 공개하고 싶지 않다**.
3. 관계는 **팔로우 후 1:1 DM**으로만 열고 싶다. 공개 댓글·좋아요 없음.

### 1.2 누구에게 (타깃)

| 레이어 | 정의 | 우선 |
|--------|------|------|
| Primary | 20–35, 한국, 사진/패션/공간/그래픽을 색으로 보는 사람. 인스타 피드 피로. | P0 |
| Secondary | 컬러리스트, 브랜드/공간 디자이너. 팔레트 로그가 작업 메모. | P1 |
| Anti | 감정 일기, 데이팅 앱, 여행 지도, 커뮤니티 게시판을 원하는 사람. | 제외 |

페르소나 (작업용):

- **A. 야간 보행자** — 매일 같은 골목, 다른 네온. 캡션 쓰기 싫음. TAKE만 찍고 앨범에 쌓음.
- **B. 팔레트 헌터** — MATCH 5의 Δ를 보고 OPEN만 연다. FOLLOW는 색이 맞을 때만.
- **C. 침묵 DM** — FOLLOW 후 한 줄 + TAKE 첨부. 첫 ₩500은 “문 여는 값”으로 받아들임.

### 1.3 핵심 기능 (제품 단위)

| ID | 기능 | 사용자 가치 | 상태 |
|----|------|-------------|------|
| F1 | CAM TAKE | 순간을 5색으로 고정 | `동작` |
| F2 | 팔레트 추출/편집 | 샷의 색을 손으로 조정 | `동작` |
| F3 | 로컬 앨범 SAVE | 로그인 없이 로그 | `동작` |
| F4 | 클라우드 persist + MATCH | 타인 5색과 거리 계산 | `코드` (AUTH 필요, 로그인 미연동) |
| F5 | OPEN 3 | 중간 블러 + 팔레트 + handle | `코드` |
| F6 | CLOSE 2 | 사진 없음, LOCK / UNLOCK SOON | `스텁` (영구) |
| F7 | FOLLOW / FOLLOWING | DM 게이트 | `코드` |
| F8 | DM + FIRST DM ₩500 | 1:1, 첫 발신만 유료 | `코드` (IAP 패키지 없음) |
| F9 | COPY PALETTE | 타인 팔레트를 내 TAKE로 | `코드` |
| F10 | ME 설정 | 매치 공개 토글, OUT | `코드` |

### 1.4 사용자 시나리오

#### S1. 게스트 — 오늘 밤 한 장 (현재 실제 가능)

1. 앱 실행 → 온보딩 `CAM` 권한.
2. Dock 셔터 → TAKE.
3. 팔레트 실패 시 `PALETTE FAIL` → `RETRY` / `SAVE RAW`.
4. 프리뷰에서 `SAVE` → 로컬 앨범.
5. LOG → ALBUM scatter에서 확인.
6. 로그인 유도 얼러트: “로그인을 하면 비슷한 색감의 사진을 찾을 수 있습니다.”
7. 게스트는 MATCH를 못 돌림. `SIGN IN` 버튼만.

#### S2. 회원 — MATCH 5 (목표, 로그인 연동 후)

1. 프리뷰 `MATCH` → 원본/블러 업로드, `match_status=pending`.
2. `take/[id]` MATCH 세그먼트 폴링.
3. 결과: 3 OPEN · 2 CLOSE. 부족하면 `NO MATCH` 슬롯.
4. OPEN 탭 → 블러만. `FOLLOW` → `DM`.
5. CLOSE 탭 → 칩 + Δ + `UNLOCK SOON`. 더 없음.

#### S3. 첫 DM

1. FOLLOW된 상대만 DM 버튼.
2. `can_send` = `needs_unlock`이면 `FIRST DM  ₩500`.
3. Android Play `dm_open_500` 결제 → `iap_google` 검증 → `dm_unlocks.status=paid`.
4. 이후 같은 peer는 무료. 상대 회신은 게이트 규칙에 따름.
5. iOS: `IOS_STUB`. 결제 불가.

#### S4. 로컬 → 클라우드 동기화

1. 게스트 SAVE 후 나중에 로그인.
2. `syncLocalAlbum`이 `remoteId` 없는 로컬 TAKE를 `persistTake(..., { runMatch: false })`.
3. 동기화 중 얼러트: “계정 동기화 중”.
4. 실패 시 `syncState=failed`. 재시도 정책은 운영 기획 §10.

### 1.5 제품 정책 (하드)

- 카피: **영문 짧은 단어 + 숫자**. 시적 문장 금지. 버튼 마이크로카피는 고정 목록만.
- 테마: **dark only**. 배경 토큰은 `colors.bg` (현재 fusion 계열. 제품 규칙 원문은 `#0B0B0B`).
- OPEN = mid blur only. CLOSE = no photo.
- MATCH 응답에 `original_path` **절대 포함 금지**.
- CLOSE는 `UNLOCK SOON` 스텁. **언락 테이블/상품 추가 금지**.
- 금지 기능: UNLOCK 경제, 광고, 구독, 퀘스트, 좋아요, 댓글, 공개 발견 피드, 미션, 지도 핀, 그룹챗, 색 이름 NLP.
- 메타포 금지: shelf / bottle / polaroid / paper / neighbor.

### 1.6 예외 케이스 (서비스 레벨)

| 상황 | 기대 |
|------|------|
| 카메라 거부 | CAM 화면에서 권한 재요청만. 앱 사용 불가에 가깝다. |
| 위치 거부 | city = null. TAKE는 진행. `CITY ?`는 선택. |
| 팔레트 < 5 | `PALETTE FAIL`. MATCH 불가. RAW 저장 가능. |
| 로그인 없이 MATCH | AUTH 에러. 프리뷰 `MATCH`는 `/(auth)`로 보냄. |
| 매치 후보 부족 | 빈 슬롯 `NO MATCH`. `match_status=empty` 또는 부분 채움. |
| 차단 쌍 | `takes_public`에서 서로 안 보임. DM `blocked`. |
| 본인 MATCH | 후보에서 제외 (owner 중복 CLOSE 방지 + 자기 TAKE 제외 RPC). |
| 네트워크 끊김 | 로컬 SAVE는 됨. persist/match/DM은 실패 메시지. |
| IAP 취소/환불 | `dm_unlocks.refunded`. `can_send.reason=refunded`. |
| 얼굴 | `face_hold` 컬럼만. 감지 UI 없음. 미개발. |

---

## 2. 사업 기획

### 2.1 BM

**단 하나의 유료 행위:** 특정 peer에게 **처음 메시지를 보내기** = ₩500.

```
무료: TAKE, 로컬 앨범, (로그인 후) MATCH 보기, FOLLOW, OPEN 블러
유료: FIRST DM ₩500 / peer
반복 과금 없음: 같은 peer 재DM, 구독, 언락, 광고
```

의도: 색 로그는 공짜. **관계를 여는 문만 유료.** CLOSE 사진을 돈으로 여는 모델은 명시적으로 버린다 (프라이버시 + 스캠/관음 방지).

### 2.2 가격

| 항목 | 값 | 비고 |
|------|----|------|
| SKU | `dm_open_500` | `EXPO_PUBLIC_IAP_PRODUCT_ID` |
| 표시 | `FIRST DM  ₩500` | 고정 카피 |
| 스토어 | Google Play consumable | Android first |
| Apple | stub | 1st store는 Google |
| 통화 | KRW | `dm_unlocks.amount_krw` default 500 |
| 가격 실험 | 미정 | 500은 담배값/커피가 아닌 **문 값**. 올리려면 카피·정책 동시 변경 |

### 2.3 시장 (가설, 검증 전)

숫자를 “확정 TAM”으로 쓰지 말 것. 아래는 **기획 가정**.

| 층 | 가정 | 용도 |
|----|------|------|
| 한국 스마트폰 사용자 | ~4,500만 | 배경 |
| 인스타/사진 앱 주 사용자 중 “피드 피로” | 가정 5–15% | SAM 방향 |
| 색/디자인 감수성 + 로그 앱 수용 | 가정 1–3% of SAM | SOM 방향 |
| HEXy Year 1 목표 (가설) | MAU 1만 / 결제 전환 2% / peer당 1회 | KPI 섹션과 연결 |

경쟁 범주:

| 범주 | 예시 | HEXy와의 차이 |
|------|------|----------------|
| 무드/일기 | Daylio, 무드 트래커 | 감정 단어 vs hex/Δ |
| 비주얼 소셜 | Instagram, VSCO | 피드·좋아요 없음 |
| 컬러 툴 | Coolors, Pantone Studio | 툴 vs 사람-색 매칭 |
| 데이팅 | 범용 데이팅 | 얼굴/바이오 없음. 색만 |
| 위치 소셜 | 지도 체크인 | city 텍스트만. 핀 금지 |

### 2.4 수익 구조

```
매출 = Σ (검증된 FIRST DM) × 500원
스토어 수수료 ≈ 15–30% (Play 정책)
순매출 ≈ 매출 × (1 − 수수료)
```

부가 수익 **금지/보류:**

- 광고 — 금지
- 구독 — 금지
- CLOSE 언락 — 금지
- 팔레트 NFT/프린트 — 미정, MVP 밖
- B2B 팔레트 API — 성장 기획 후순위

### 2.5 비용 구조

| 항목 | 성격 | 스케일 민감 |
|------|------|-------------|
| Supabase (DB, Auth, Storage, Edge) | 변동 | TAKE 원본 JPEG, 벡터 검색 |
| Play 개발자 / EAS 빌드 | 고정+변동 | |
| 푸시/이메일 (Magic Link) | 변동 | |
| 법적 (개인정보, 약관) | 고정 | 출시 전 필수 |
| CS / 신고 처리 | 인건비 | MAU에 비례 |
| 광고비 | GTM | 초기엔 커뮤니티 위주 가정 |

원본 버킷 `takes-original` 8MB 제한, 블러 1MB. 스토리지가 가장 먼저 커진다. **원본은 owner signed URL만.**

### 2.6 KPI (사업)

| KPI | 정의 | 가드 |
|------|------|------|
| WAU | 주 1회 이상 TAKE 또는 앱 오픈 | 허영 지표 단독 사용 금지 |
| TAKE/WAU | 주간 촬영 수 / WAU | 코어 루프 |
| SAVE rate | 프리뷰 → SAVE | 로컬 가치 |
| MATCH start rate | 로그인 유저 중 MATCH 누른 비율 | 클라우드 가치 |
| OPEN view / MATCH | OPEN 상세 진입 | 호기심 |
| FOLLOW / OPEN | 관계 전환 | |
| DM unlock / FOLLOW | 유료 문 | 핵심 매출 |
| 환불율 | refunded / paid | 2% 넘으면 정책 재검토 |
| D7 retention | TAKE 1회 유저의 7일 재방문 | 성장 |

---

## 3. UI/UX 기획

### 3.1 원칙

- **한 화면 = 한 숫자 또는 한 행동.** 설명 문단 없음.
- 버튼 라벨은 영문 고정. 안내/에러만 한글 (`src/lib/messages.ts`).
- 다크, 모노 폰트 `SpaceMono`.
- Jelly UI (DOM WebView). **Expo Go 불가. Dev client만.**
- 제스처보다 **탭**. scatter 앨범만 예외 (배치 애니메이션).

### 3.2 IA / 화면 맵

```
index                → /(onboarding)  (카메라 권한)
/(onboarding)        CAM, CITY ?
/(auth)              GOOGLE, MAGIC LINK
/(tabs)/cam          뷰파인더 + ME + Dock 셔터
/(tabs)/log          ALBUM | INBOX
me                   프로필 / 매치 공개 / OUT
take/preview         SAVE | MATCH, ← BACK
take/[id]            TAKE | MATCH | SHARE | DELETE
local/[id]           로컬 상세, SIGN IN, BACK, DELETE
match/[id]           → take/[id] 리다이렉트
open/[takeId]        블러 OPEN
close/[takeId]       UNLOCK SOON
user/[handle]        공개 프로필
dm/[threadId]        1:1
```

탭은 2개뿐: **CAM / LOG**. LOG 안에서 ALBUM / INBOX.

### 3.3 핵심 화면 흐름

```
온보딩 ─CAM권한─▶ CAM ──셔터──▶ (추출)
                              ├ 성공 ▶ preview ─┬ SAVE ▶ LOG/ALBUM
                              │                 └ MATCH ▶ auth? ▶ take/[id]
                              └ 실패 ▶ PALETTE FAIL ▶ RETRY | SAVE RAW ▶ preview
LOG ◀──────────────────────────┘
  ├ ALBUM scatter ▶ local/[id] | take/[id]
  └ INBOX ▶ dm/[threadId]
take/[id] MATCH ▶ open/[id] | close/[id]
open ▶ FOLLOW ▶ DM
```

### 3.4 인터랙션

| 요소 | 동작 |
|------|------|
| Dock 셔터 | CAM에서만 보임. 촬영 + 셔터음 wav. 시스템 셔터 OFF. |
| GlassToggle | CAM ↔ LOG. 색은 `btnDock` / `nextChip`. |
| AlbumScatter | 흩어진 프레임. 탭=상세, 롱프레스=삭제. INBOX→ALBUM 복귀 시 replay. |
| TakeFrame | 팔레트 칩 드래그로 색 교체. 드롭 시 persist (클라우드 TAKE). |
| Alert | 중앙 jelly-alert. 타임아웃 + **화면 탭 닫기**. |
| OPEN 이미지 | mid blur. 원본 경로 노출 금지. |
| CLOSE | 칩 + `LOCK` + Δ + `UNLOCK SOON`. 사진 영역 없음. |
| 풀스크린 원본 | **내 TAKE만** signed URL. |

### 3.5 모바일 / PC

| 표면 | 방침 |
|------|------|
| Android phone | P0. 세로 고정. |
| iOS | 빌드는 가능하나 IAP stub. Google Sign-In 플러그인도 미완. |
| Tablet | `supportsTablet: false`. |
| Web | 정적 번들 있으나 Jelly/카메라/IAP 비목표. SEO 랜딩은 별도 웹(미정). |

### 3.6 와이어프레임 노트 (해상도 단위)

- CAM: 풀블리드 카메라. 우상단 ME. 하단 중앙 셔터, 우측 GlassToggle.
- Preview: 상단 `← BACK` + `TAKE ####`. 중앙 TakeFrame. 하단 SAVE | MATCH 한 쌍.
- LOG: 상단 ALBUM / INBOX / ME. ALBUM은 검색 필드 + scatter.
- take/[id]: 번호, TakeFrame, TAKE/MATCH/SHARE, DELETE TAKE, MATCH 5 리스트.

---

## 4. 기능 기획

기능 단위로 입력·출력·버튼·상태·validation·edge를 적는다.

### 4.1 F1 CAM TAKE

| | |
|--|--|
| 입력 | CameraView `quality=0.55`, facing=back |
| 출력 | `draft`: localUri, palette[], city?, capturedAt, source, fail |
| 버튼 | Dock 셔터. 권한 없을 때 `CAM`. |
| 상태 | `dock.shooting`, `busyRef` (연속 촬영 차단) |
| Validation | 권한 granted. uri 존재. |
| Edge | 촬영 중 탭 전환 → shooting 플래그. 추출 실패 → failUri 화면. |

### 4.2 F2 팔레트 추출

| | |
|--|--|
| 입력 | JPEG uri |
| 출력 | colors[5] `{hex,r,g,b,l,a,lab_b,ratio}` 또는 fail |
| 버튼 | `RETRY`, `SAVE RAW` |
| 상태 | draft.fail |
| Validation | 5색 미만이면 MATCH 불가 (`ready = palette.length >= 5`) |
| Edge | RAW는 original만 업로드, blur 없음, match_status idle. |

### 4.3 F3 로컬 SAVE

| | |
|--|--|
| 입력 | draft |
| 출력 | `hexy-album` 문서 디렉터리 + 인덱스 |
| 버튼 | `SAVE` (preview left) |
| 상태 | local.syncState: pending / syncing / synced / failed |
| Validation | draft 존재, 중복 persist 방지 `started` ref |
| Edge | 비로그인 SAVE 후 얼러트 `saveAlbumSignIn`. |

### 4.4 F4 persist + match_take

| | |
|--|--|
| 입력 | AUTH, draft, `runMatch?` |
| 출력 | takes row. seq = `next_take_seq`. 비동기 upload + invoke `match_take` |
| 버튼 | `MATCH` |
| 상태 | takes.status: processing → ready/failed. match_status: pending → ready/empty/failed |
| Validation | uid 필수. 5색이어야 match pending. match_public = profile.default && !raw && ready |
| Edge | 업로드 실패 → status failed. 후보는 90일·L2 50개. CLOSE score≥0.82 owner 유니크 2. OPEN score≥0.48 나머지 3. |

**match_take 입출력**

- In: `{ take_id }`, Authorization
- Out: `{ ok }` 또는 error `AUTH|TAKE|CANDIDATES|METHOD`
- Side effect: `take_matches` upsert, match_status 갱신
- **응답/뷰에 original_path 없음**

### 4.5 F5 OPEN

| | |
|--|--|
| 입력 | takeId (public view) |
| 출력 | blur, palette, handle, city, Δ (라우트/리스트에서) |
| 버튼 | FOLLOW/FOLLOWING, DM (팔로우 후), COPY PALETTE |
| Validation | takes_public + 차단 필터. 비로그인 FOLLOW → auth |
| Edge | blur 없으면 line 플레이스홀더. COPY는 새 TAKE `source=palette_copy`. |

### 4.6 F6 CLOSE

| | |
|--|--|
| 입력 | takeId, delta query |
| 출력 | palette strip, CLOSE MATCH, Δ, UNLOCK SOON |
| 버튼 | 없음 (언락 버튼 금지) |
| Edge | 사진/원본/블러 렌더 금지. |

### 4.7 F7 FOLLOW

| | |
|--|--|
| 입력 | followee_id |
| 출력 | follows row |
| 버튼 | FOLLOW ↔ FOLLOWING |
| Validation | 자기 자신 금지. AUTH. |
| Edge | OPEN 리스트의 FOLLOW는 unfollow 미구현(단방향 set true). 상세/프로필은 unfollow 있음. **불일치 — 수정 대상.** |
| API | follow, unfollow, isFollowing, listFollowing, listBlocks, blockUser (UI 없음) |

### 4.8 F8 DM + IAP

| | |
|--|--|
| 입력 | peer, body, attached_take_id? |
| 게이트 | `can_send`: ok / needs_unlock / no_follow / blocked / refunded / AUTH / SELF |
| 버튼 | SEND, TAKE(첨부 피커), 결제 트리거(게이트 시) |
| 실시간 | supabase channel `dm:{threadId}` |
| IAP | Android only. `expo-iap` **package.json 없음 → 런타임 IAP 에러**. |
| Edge | 빈 body + 첨부만 — RPC 허용 여부는 `send_dm` 정의. 스레드 unique (user_a < user_b). |

### 4.9 F9 COPY PALETTE

| | |
|--|--|
| 입력 | 타인 public take id |
| 출력 | 내 TAKE, source=palette_copy, 사진 없이 팔레트만 |
| Edge | 원본 이미지 복사 금지. |

### 4.10 F10 Auth / ME

| | |
|--|--|
| GOOGLE | `signInWithGoogle` **동적 import**. 패키지 미설치, Client ID 빈 값, 플러그인 없음. 버튼은 있으나 **미연동**. |
| MAGIC LINK | `signInWithOtp` + `hexy://auth`. 딥링크/이메일 템플릿 검증 전. |
| 세션 | SecureStore persist, hydrate, handle_new_user 백업 |
| Handle | `user` + 6 hex. 변경 UI 없음. 형식 `^[a-z0-9_]{3,20}$` |
| ME | default_match_public Switch, following/block count, IAP paid refetch, OUT |

### 4.11 상태 머신 — TAKE

```
capture
  → extract ok → draft.fail=false → SAVE | MATCH
  → extract fail → PALETTE FAIL → RETRY | SAVE RAW (source=raw)

persist
  insert status=processing
  upload original (private) / blur (public)
  → ready | failed
  match: idle | pending → ready | empty | failed
```

### 4.12 Validation 일람

| 필드 | 규칙 |
|------|------|
| handle | 3–20, `[a-z0-9_]` |
| palette | JSON array, MATCH는 5 |
| seq | owner당 unique, RPC 증가 |
| band | open \| close |
| rank | 1–5 unique per source |
| dm body | text, default `''` |
| storage original | jpeg, ≤8MB, path `{uid}/{takeId}/original.jpg` |
| storage blur | jpeg, ≤1MB, public |
| IAP store_tx_id | unique |

---

## 5. 정보구조 (IA)

### 5.1 내비게이션 체계

```
Root
├ 온보딩 (1회 권한)
├ Auth (모달/스택)
├ Tabs
│  ├ CAM
│  └ LOG
│     ├ ALBUM (default)
│     └ INBOX
├ Stack overlays
│  ├ ME
│  ├ preview
│  ├ take / local
│  ├ open / close
│  ├ user
│  └ dm
└ 404
```

하단 Dock은 탭바 대체: 셔터 + CAM/LOG 토글. 시스템 탭 라벨 없음.

### 5.2 URL / 라우트

Expo Router file-based. 딥링크 scheme `hexy://`.

| 경로 | 인증 | SEO |
|------|------|-----|
| `/` | 무관 | 앱 엔트리. 웹 SEO 대상 아님 |
| `/(onboarding)` | 무관 | |
| `/(auth)?next=log` | 게스트 | |
| `/(tabs)/cam` | 무관 | |
| `/(tabs)/log` | 무관 (INBOX는 세션) | |
| `/me` | 세션 권장 | |
| `/take/preview` | draft | |
| `/take/[id]` | owner | |
| `/local/[id]` | 디바이스 | |
| `/open/[takeId]` | 공개 | 웹 공유 시 블러만 |
| `/close/[takeId]?delta=` | 공개 메타만 | 사진 없음 |
| `/user/[handle]` | 공개 | handle은 유일. 웹 카드 미정 |
| `/dm/[threadId]?peer=` | 세션 | 인덱스 금지 |

웹 SEO: **앱이 웹 서비스가 아님.** 추후 마케팅 랜딩(`hexy.app`)은 별도 IA. 앱 라우트를 인덱싱하지 말 것. `original` 절대 공개 URL 금지.

### 5.3 메뉴 / 카테고리

카테고리 없음. 검색은 ALBUM `날짜 / HEX` 한 필드.

INBOX는 폴더 없음. 스레드 리스트: handle, last, unpaid/OPEN 플래그.

---

## 6. 데이터 기획

### 6.1 엔터티 관계

```
auth.users 1──1 profiles 1──1 user_counters
profiles 1──* takes
takes 1──* take_matches (source)
takes 1──* take_matches (target)
profiles *──* follows
profiles *──* blocks
profiles *──* dm_threads (user_a, user_b ordered)
dm_threads 1──* dm_messages
profiles 1──* dm_unlocks (payer→peer)
iap_events (store_tx_id unique)
```

### 6.2 핵심 테이블

**profiles**  
id, handle unique, display_name, avatar_url, default_match_public, created_at

**takes**  
id, owner_id, seq, captured_at, city, palette jsonb, palette_vec vector(15),  
original_path, blur_path, match_public, face_hold,  
source ∈ capture|library|palette_copy|raw,  
status ∈ ready|processing|failed|deleted,  
match_status ∈ idle|pending|ready|empty|failed

**take_matches**  
source_take_id, target_take_id, band open|close, rank 1–5, score, delta  
unique (source, rank), unique (source, target)

**dm_unlocks**  
payer_id, peer_id, amount_krw=500, store apple|google, product_id, store_tx_id unique,  
status pending|paid|refunded|failed  
partial unique (payer, peer) where paid

**takes_public view**  
ready + match_public + 차단 제외. **original_path 컬럼 없음.**

### 6.3 스토리지

| 버킷 | public | 한도 | 경로 |
|------|--------|------|------|
| takes-original | no | 8MB jpeg | `{uid}/{takeId}/original.jpg` |
| takes-blur | yes | 1MB jpeg | `{uid}/{takeId}/blur.jpg` |
| avatars | yes | 512KB jpeg | (스키마만, 업로드 UI 없음) |

### 6.4 로컬 데이터

디바이스 `Paths.document/hexy-album`.  
필드: id, photoUri, palette, city, capturedAt, seq, source, fail, remoteId, syncState.  
로그인 전 로그의 SSOT.

### 6.5 로그 / 이벤트 (아직 미구현 — §12에서 설계)

서버 감사: `iap_events`. 프로덕트 이벤트 테이블 없음.

### 6.6 보유·삭제

| 데이터 | 삭제 시 |
|--------|---------|
| TAKE DELETE | row + storage 객체 (구현 확인 필요). matches cascade. |
| 탈퇴 | 미구현. 정책 §9 / 보안 §14. |
| DM | 스레드 cascade 메시지. 탈퇴 시 상대에게 남는지는 미정. |
| 원본 | owner만. 매칭 응답에 안 탐. |

---

## 7. 시스템 / 기술 기획

### 7.1 왜 Supabase인가

| 요구 | 선택 |
|------|------|
| Auth + RLS + Storage + RPC + Edge | Supabase 한 곳 |
| 벡터 검색 | pgvector HNSW on palette_vec(15) |
| 실시간 DM | Realtime channel |
| 서버리스 매칭 | Edge `match_take`, `iap_google`, `handle_new_user` |
| 모바일 세션 | SecureStore adapter |

Firebase를 안 쓰는 이유: 커스텀 벡터+RPC+SQL 제약(`can_send`)이 Postgres가 맞음. 풀타임 서버(Nest 등)는 MVP 과잉.

### 7.2 구성

```
[Android Dev Client]
  Expo Router / RN 0.86 / Reanimated / Jelly DOM WebView
  expo-camera, expo-audio, expo-location, expo-secure-store
       │ HTTPS
[Supabase]
  Auth  Google(예정) / Email OTP
  Postgres + RLS + pgvector
  Storage
  Edge Functions
[Google Play]  IAP + (예정) Sign-In SHA-1
```

### 7.3 API 표면

| 종류 | 예 |
|------|----|
| PostgREST | takes, follows, dm_*, profiles |
| RPC | next_take_seq, match_take_candidates, can_send, open_or_get_thread, send_dm, block_user |
| Edge | match_take, iap_google, iap_apple(stub), handle_new_user |
| Storage | upload original/blur, signed original |

클라이언트 모듈: `src/features/{auth,cam,take,dm,follow,profile,alert,nav,album}`.

### 7.4 인증 기술 상태 (정직)

| 조각 | 상태 |
|------|------|
| supabase-js + SecureStore | `코드`/부분 `동작` (키 있으면 세션 유지) |
| Google Sign-In native | **미연동**: 패키지·플러그인·env·Play SHA-1·Supabase provider |
| Magic Link | 코드만. 리다이렉트/메일 미검증 |
| handle_new_user | SQL trigger 주경로 + Edge 백업 |

### 7.5 배포

- 앱: EAS / `expo run:android`. `android/`는 git 제외, `prebuild:android`.
- Edge: Supabase MCP `hexy-supabase`만. `apply_migration` 전 `supabase/migrations/`.
- 환경: `EXPO_PUBLIC_SUPABASE_URL`, `ANON_KEY`, `GOOGLE_WEB_CLIENT_ID`, `IAP_PRODUCT_ID`, `EAS_PROJECT_ID`.
- 패치: `patches/expo+57.0.20.patch` (DomWebView injectJavaScript). 지우면 Android cold start 깨짐.

### 7.6 클라이언트 제약

- Jelly = `@expo/dom-webview`. Expo Go 불가.
- `expo-iap`, `@react-native-google-signin/google-signin` **dependencies에 없음**.

---

## 8. 콘텐츠 기획

### 8.1 톤

영어 짧은 단어. 숫자. 차갑고 힙. **감정 형용사 금지.**  
한글은 안내/에러만. 버튼은 영문.

잘못된 예: “비슷한 감성의 밤을 공유하세요.”  
맞는 예: `MATCH 5` / `3 OPEN · 2 CLOSE` / `Δ 4.2`

### 8.2 고정 마이크로카피 (변경 시 제품 규칙 수정)

TAKE, MATCH 5, 3 OPEN · 2 CLOSE, Δ, LOCK, UNLOCK SOON, DELETE TAKE, FIRST DM  ₩500, NO MATCH, PALETTE FAIL, COPY PALETTE, FOLLOW, FOLLOWING, DM.

추가 사용 중: RETRY, SAVE RAW, CAM, BACK, SAVE, MATCH, SHARE, SIGN IN, GOOGLE, MAGIC LINK, ALBUM, INBOX, ME, SEND, AUTH, OUT, IAP.

### 8.3 한글 메시지 (`messages.ts`)

| 키 | 문구 |
|----|------|
| signInColorMatch | 로그인을 하면 비슷한 색감의 사진을 찾을 수 있습니다. |
| signInMatchDm | 매치 · DM · 로그인 |
| dateHexPlaceholder | 날짜 / HEX |
| unpaid | 미결제 |
| saveAlbumSignIn | 앨범 저장 · 비슷한 색 찾기 · 로그인 |
| local | 로컬 |
| syncingAccount | 계정 동기화 중 |
| onboardingTag | 색 로그 |
| 에러 코드 | AUTH, TAKE, SAVE, IAP, IOS_STUB, needs_unlock, no_follow, blocked, … |

### 8.4 온보딩 콘텐츠

지금: 타이틀 HEXy, 태그 “색 로그”, 버튼 CAM / CITY ?.  
없음: 약관, 개인정보 동의 체크, 튜토리얼 3장, 핸들 입력.

출시 전 필수 추가: 이용약관 / 개인정보처리방침 링크, 카메라·위치 목적 한 줄(법적). 톤은 여전히 짧게.

### 8.5 이미지

- 앱 아이콘 / adaptive / splash — 있음.
- 온보딩 일러스트 — 없음. 넣지 않는 편이 톤에 맞음.
- OPEN = blur JPEG. CLOSE = 칩만.
- 공유 SHARE = 내 사진 또는 블러. 슬레이트 컴포넌트 `SlateShare` 존재, 플로우 연결은 부분적.

### 8.6 도움말 / 공지

없음. 인앱 FAQ 금지에 가깝다 (시적 설명 방지). 스토어 설명만 별도 마케팅 카피.

---

## 9. 정책 기획

개발 중 가장 빠지기 쉬운 부분. **현재 구멍 많음.**

### 9.1 회원가입

- 방법: Google (목표), Magic Link (보조).
- 연령: 미정. Play 타깃 연령·14세 미만 수집 금지 여부 **출시 전 법률 확인**.
- 프로필: handle 자동. display_name=handle. 아바타 UI 없음.
- 중복: handle unique, 충돌 시 재시도 8회.

### 9.2 탈퇴

**미구현.** 필요 정책:

1. 즉시: 세션 종료, 로그인 불가.
2. 유예 7일 또는 즉시 파기 — 선택 필요.
3. takes / storage / follows / DMs / dm_unlocks 처리.
4. 상대 DM: “삭제된 사용자” vs 메시지 하드딜리트.
5. 결제 기록: 세법/스토어상 보관 vs 계정 파기. **unlock 로그는 익명화 보관 권장.**

### 9.3 차단 / 신고

| | 상태 | 정책 초안 |
|--|------|-----------|
| 차단 | RPC `block_user`, ME에 개수만 | 쌍방향 숨김. 언팔로우 포함해야 함. 차단 UI(버튼) 없음 → 출시 전 필수 |
| 신고 | **없음** | OPEN/DM/프로필에 REPORT. 사유: 성적/혐오/스팸/기타. 관리자 큐 §10 |
| 콘텐츠 | 원본은 비공개인 점이 리스크를 줄임. 블러+handle은 신고 대상 | |

### 9.4 게시물(TAKE) 삭제

- 오너는 `DELETE TAKE`.
- 로컬: 파일+인덱스.
- 원격: deleteTake. 매치 cascade.
- 이미 COPY된 팔레트 TAKE는 독립. 원본 삭제와 무관.
- 소프트 `status=deleted` vs 하드. 스키마에 deleted 있으나 클라이언트는 하드에 가까움 → **통일 필요**.

### 9.5 매치 공개

- `default_match_public` 토글.
- TAKE별 토글 UI는 약함(insert 시 기본값). **TAKE 단위 비공개** 필요 여부 미정.
- RAW / 실패는 매치 비공개.

### 9.6 결제 / 환불

- 상품: 첫 DM 문. 디지털 소비성.
- 환불: Play 환불 → `iap_events` 재처리 → status=refunded → 추가 발신 차단.
- 부분 환불 없음.
- 미성년 결제: Play 가족 설정에 위임 + 약관 명시.

### 9.7 포인트 / 구독

없음. 만들지 않음.

### 9.8 권한

| 역할 | 권한 |
|------|------|
| guest | CAM, 로컬 앨범 |
| user | persist, match, follow, dm(게이트), me |
| peer | 내 블러+팔레트 (public). 원본 불가 |
| service_role | match, iap verify, handle 생성 |
| admin | **없음** (운영 구멍) |

### 9.9 커뮤니티 에티켓 (짧음)

- 얼굴 원본을 OPEN에 올리지 않음 (시스템).
- DM 스팸: ₩500이 1차 브레이크. 반복 스팸은 차단+신고.
- 성적 착취·미성년: 무관용, 즉시 정지 (운영 플레이북 필요).

---

## 10. 운영 기획

### 10.1 지금 없는 것

관리자 페이지, CS 채널, 공지, 원격 컨피그, 크래시 대시보드 연동 문서화, 신고 큐.

### 10.2 출시 최소 운영 세트

| 기능 | 최소안 |
|------|--------|
| Admin | Supabase 대시보드 + SQL. 이후 `admin_roles` 테이블 |
| CS | 스토어 이메일 1개. 응답 SLA 2영업일 |
| 신고 | `reports` 테이블 + 주 3회 트리아이징 |
| 장애 | Status 페이지 대신 인스타/X 한 계정. Edge 알림(Supabase) |
| 공지 | 강제 업데이트 아니면 생략. 톤 유지 |
| 콘텐츠 | 유저 생성만. 에디토리얼 피드 금지 |

### 10.3 장애 대응

| 증상 | 액션 |
|------|------|
| Auth down | 로컬 SAVE만 안내. MATCH/DM 비활성 |
| match_take 5xx | match_status=failed. RETRY 버튼(미구현) |
| Storage full | 신규 persist 거절. 원본 없이 팔레트만? **정책 미정** |
| IAP verify fail | 유저에 VERIFY. 수동 토큰 재처리 런북 |
| 잘못된 매치 (원본 누출) | **P0 보안사고.** 함수/뷰 점검, 키 로테이션 |

### 10.4 동기화 운영

`syncLocalAlbum` 실패 재시도: 앱 포그라운드마다. 무한 루프 방지 필요(현재 failed는 재포함 안 함). CS: “로컬에만 있음” vs “클라우드 실패”.

---

## 11. 마케팅 / GTM

### 11.1 포지션 한 줄

**Color log. MATCH 5. First DM ₩500.**  
인스타 대체라고 하지 않는다. 일기라고 하지 않는다.

### 11.2 채널 (우선순위)

| 채널 | 적합 | 이유 |
|------|------|------|
| ASO (Play) | P0 | Android first |
| 디자인/사진 커뮤니티 | P0 | Are.na, 트위터/X KR, 디스코드는 톤 주의 |
| 인스타 | P1 | 역설: 피드 피로 타깃이 여기 있음. 계정은 칩/Δ만 |
| 유료 광고 | P2 | 결제 단가 500원이라 UA CAC 한도 극소 |
| SEO 랜딩 | P2 | 앱 스토어로만 보냄 |
| 리퍼럴 | P2 | 초대 코드는 퀘스트처럼 보이면 금지. handle 공유 정도 |
| 인플루언서 | P1 | 팔레트 계정. 대본에 감정 형용사 금지 |

### 11.3 런칭 전략

1. **Closed Play** — 내부 + 디자인 지인 50. Google 로그인·IAP 샌드박스 검증.
2. **Soft KR** — Play 프로덕션. CLOSE/UNLOCK 기대 관리 (스토어 설명: CLOSE는 잠김).
3. **ASO 키워드** — 색, 팔레트, 로그, 매칭. “데이팅” 넣지 않음.
4. iOS는 결제 stub이므로 런칭에서 빼거나 “Android only”.

### 11.4 스토어 카피 초안 (영문 톤)

- Title: HEXy
- Short: Color log. MATCH 5.
- 금지: “Find your soulmate”, “Unlock photos”, “Mood journal”.

---

## 12. 분석 / 지표 기획

### 12.1 성공 정의 (MVP)

**주 1회 TAKE하는 사람**이 늘고, 그중 일부가 **OPEN → FOLLOW** 하며, 극소수가 **₩500 DM**을 연다.  
다운로드 수 단독 성공 아님.

### 12.2 퍼널

```
App open → CAM perm → TAKE → Preview
  ├ SAVE (로컬 성공)
  └ SIGN IN → MATCH start → MATCH ready
       → OPEN view → FOLLOW → DM unlock → SEND
```

### 12.3 이벤트 (아직 미심음 — 심을 목록)

| event | props |
|-------|--------|
| `take_shutter` | fail |
| `palette_fail` | |
| `take_save_local` | source |
| `take_persist` | runMatch |
| `match_ready` | open_n, close_n, empty |
| `open_view` | take_id (hashed) |
| `close_view` | |
| `follow` | |
| `dm_unlock_start` / `_ok` / `_fail` | reason |
| `dm_send` | has_attach |
| `auth_google_fail` | |
| `sync_local` | ok_n, fail_n |
| `alert_show` | key |

PII: handle/email/원본 URI 이벤트에 넣지 말 것. take_id는 내부 분석만.

### 12.4 도구

미정. 후보: PostHog (self/EU), 또는 초기에 SQL만. Firebase Analytics는 톤·벤더 중복. **출시 전 1개만.**

### 12.5 가드레일

- CLOSE view 대비 UNLOCK 시도 ≈ 0이어야 함 (버튼 없음).
- original URL 4xx/유출 모니터링.
- IAP fail rate > 20%면 Play 설정 점검.

---

## 13. 수익화 기획

### 13.1 현재 포인트

```
[TAKE 무료] → [MATCH 무료] → [OPEN 무료] → [FOLLOW 무료]
 → [첫 DM] ──₩500──▶ [이후 DM 무료]
```

`dm_unlocks`는 **payer × peer**. 양방향 첫 발신이 둘 다 내야 하는지는 `can_send` 구현에 따름. **문서화 필수:** 상대가 먼저 보내면 나는 무료인지.

### 13.2 연결 규칙

- 결제 전에 메시지 본문 미리보기 저장하지 않음 (결제 실패 시 유실 OK).
- 언락은 스레드가 아니라 **peer 관계**.
- CLOSE 언락 SKU 추가 = 제품 위반.

### 13.3 의도적으로 안 여는 포인트

광고 슬롯, 프리미엄 MATCH 슬롯, 부스트, 시즌 패스, 색 이름 구독.

### 13.4 확장 (성장 단계, 승인 전까지 금지)

- 동일 SKU 가격만 변경.
- 선물하기 (타인이 내 첫 DM을 열어줌) — 정책 복잡, 보류.
- B2B: 브랜드 팔레트 매칭 — 별개 제품.

---

## 14. 보안 / 개인정보 기획

### 14.1 수집 범위

| 데이터 | 목적 | 필수 |
|--------|------|------|
| 이메일 (OTP/Google) | 계정 | 로그인 시 |
| Google idToken | 인증 | Google 시 |
| 사진 원본 | 오너 아카이브 | MATCH/클라우드 시 |
| 블러 | OPEN | MATCH 공개 시 |
| 팔레트/벡터 | 매칭 | MATCH 시 |
| city (역지오코딩) | 로그 메타 | 위치 허용 시 |
| 구매 토큰 | 검증 | IAP 시 |
| 메시지 body | DM | 발신 시 |

카메라·위치는 온보딩에서 분리. 위치는 선택.

### 14.2 접근 권한

- original: owner RLS + signed URL. **매칭/공개 뷰 제외.**
- blur: public read. 중간 블러만.
- Service role: Edge만. 클라이언트 금지.
- MCP: repo `hexy-supabase`만. 개인 `~/.cursor/mcp.json`에 Supabase 넣지 않음.

### 14.3 인증

- 세션: SecureStore, auto refresh.
- Google: webClientId 필수. Play SHA-1 등록.
- OTP: `hexy://auth`. 웹 인터셉트 주의 (`detectSessionInUrl: false`).

### 14.4 보관 / 삭제

- 원본: 계정 기간. 탈퇴 정책과 연동 (미정).
- IAP payload: 부정 결제 대응 기간 (스토어+세법, 법률 확인).
- 위치: city 문자열만. 위경도 저장 여부 코드 확인 — **좌표 장기 저장 금지 권장.**

### 14.5 보안 정책

- MATCH 응답에 original_path 금지 = 코드 리뷰 체크리스트.
- Storage MIME/size 제한.
- RLS 0004 + security 0006.
- 시크릿: `.env` 커밋 금지. anon key는 공개 가능하나 RLS가 전제.
- 미성년·CSAM: 신고 시 보존 후 수사 협조 플레이북 (출시 전).

### 14.6 출시 전 문서

개인정보처리방침, 이용약관, Play Data safety 폼 (사진, 위치 대략, 구매).  
동의 UI가 온보딩에 없음 → **추가 필요.**

---

## 15. QA / 테스트 기획

### 15.1 매트릭스

| 축 | 값 |
|----|----|
| OS | Android 실기기 (P0), iOS (P2), Web (P3) |
| 세션 | guest / user / user+unpaid DM / user+paid / blocked pair |
| 네트워크 | on / off / 중간 끊김 |
| 권한 | cam X, loc X, cam O loc X |
| 스토어 | IAP license tester / 프로덕션 |

### 15.2 케이스 — 로컬 (지금 돌려야 함)

1. 권한 거부 → CAM 버튼만.
2. 셔터 → preview 팔레트 5.
3. PALETTE FAIL → RETRY 성공, SAVE RAW 후 로컬 상세.
4. SAVE → ALBUM scatter 증가.
5. 롱프레스 삭제.
6. 검색 날짜/HEX.
7. Alert 탭 닫기, 백 버튼 닫기.
8. Dock CAM↔LOG, 셔터 숨김 애니메이션.
9. preview BACK → CAM, draft 폐기.

### 15.3 케이스 — 클라우드 (로그인 연동 후)

1. Google 성공/실패/취소/Play Services 없음.
2. Magic Link 앱 복귀 세션.
3. persist 중 킬 → processing leftover.
4. MATCH pending 폴링 → 5 슬롯 또는 NO MATCH.
5. OPEN에 original이 **네트워크 탭에 없음**.
6. CLOSE에 img 태그 없음.
7. FOLLOW 없이 DM 버튼 숨김.
8. ₩500 성공/취소/verify fail/환불 후 SEND.
9. iOS SEND → IOS_STUB.
10. 차단 후 서로 takes_public/DM.
11. COPY PALETTE가 원본 파일을 안 만듦.
12. 로컬 동기화 중복 persist 없음.

### 15.4 회귀 (Jelly)

- Expo Go에서 버튼 없음 (예상).
- DomWebView zero height / FOUC / Reanimated exiting.
- 컬러 토큰 변경 후 대비율 (fusion 배경 + nimbus 버튼).

### 15.5 보안 QA

- 타인 take id 추측으로 original signed URL 발급 불가.
- Edge match_take를 타인 take_id로 호출 → 404.

---

## 16. 출시 / 배포 기획

### 16.1 MVP 범위 (다시 자름)

**MVP-A — 지금 가까운 것 (로컬 로그)**  
CAM, 팔레트, SAVE, ALBUM, 삭제, 토큰/얼러트 UI.

**MVP-B — 소셜 최소 (연동 필요)**  
Google 로그인, persist, MATCH 5, OPEN/CLOSE 스텁, FOLLOW, DM 텍스트, Android IAP.

**MVP-C — 출시 게이트**  
약관/개인정보, 차단 UI, 신고, 탈퇴, Data safety, 크래시, 이벤트 8개, Play 내부 테스트 통과.

**명시적 Non-MVP**  
iOS IAP, handle 편집, 갤러리 library, face_hold, 아바타, 관리자 콘솔, 웹 SEO, CLOSE 언락.

### 16.2 버전

| ver | 내용 |
|-----|------|
| 0.1 | 로컬 루프 (현재에 가까움) |
| 0.2 | Google + MATCH + DM 샌드박스 |
| 1.0.0 | Play 프로덕션 (app.config 이미 1.0.0 — **실제와 불일치, 0.x로 내릴지 결정**) |

### 16.3 스토어 심사 리스크

- 카메라/위치 목적 문구 짧음 (`CAM`, `GEO`) → 반려 가능. 목적 문장 필요.
- IAP 미연결 상태로 ₩500 카피만 있으면 오해.
- 사진 앱 + 매칭 = 데이팅으로 오인. 설명에서 데이팅 부정.
- 로그인 없이 핵심이 되면 “불완전 앱” 반려. MVP-A만 내면 MATCH 카피를 숨길지 결정.

### 16.4 배포 / 롤백

- JS: OTA (`expo start` / EAS Update) — 네이티브 모듈 없는 변경.
- Native (camera, IAP, Google Sign-In): Play 트랙. 롤백 = 이전 APK.
- DB: migrations forward-only. 위험 변경은 expand/contract.
- Edge: MCP deploy. 이전 소스 `supabase/functions/*/index.ts`가 SSOT.

### 16.5 일정 (의존성 순서, 날짜는 팀 속도)

1. Google Sign-In 패키지 + SHA-1 + Supabase provider + env  
2. Magic Link 딥링크 검증  
3. persist/match를 실계정 1쌍으로 E2E  
4. expo-iap + Play 초안 + iap_google  
5. 차단 버튼 + 약관  
6. 내부 테스트 → 프로덕션  

---

## 17. 성장 기획

제품 규칙과 충돌하는 성장 해킹은 버린다.

### 17.1 허용되는 성장

| 루프 | 설명 |
|------|------|
| TAKE 습관 | 매일 셔터가 가벼운가. 로컬 앨범이 쌓이는가. |
| MATCH 호기심 | OPEN 블러가 충분한가. CLOSE는 **결핍을 팔지 않고** 닫아 둔다. |
| FOLLOW | 색이 맞을 때만. 추천 피드 없이 **이 TAKE의 상대만**. |
| DM ₩500 | 희소. 가격이 스팸을 죽임. |
| SHARE | 내 TAKE 번호+팔레트. 원본 공유는 오너 선택. |
| COPY PALETTE | 색만 전파. 사진 복제 아님. |

### 17.2 알림 (미구현, 신중)

허용 후보: MATCH ready, DM 수신.  
금지: “비슷한 무드의 사람이 근처에”, 퀘스트 리마인더, 위치 푸시.

### 17.3 추천 / 개인화

공개 발견 피드 = 금지.  
개인화는 **내 최근 팔레트와 MATCH 알고리즘 파라미터** 정도. 홈 피드 만들지 말 것.

### 17.4 바이럴

`user/[handle]` + OPEN 링크. 웹 OG는 블러+칩만. 원본 OG 금지.  
리퍼럴 보상(무료 DM)은 스팸+경제 왜곡. 보류.

### 17.5 로드맵 (규칙 안)

1. 인증·매치·IAP를 **실제로** 붙인다.  
2. 차단/신고/탈퇴.  
3. TAKE 단위 match_public.  
4. MATCH 재실행.  
5. handle 변경.  
6. iOS IAP (2nd store).  
7. library import (스키마만 있음).  

하지 않음: UNLOCK SOON을 진짜 언락으로 바꾸기, 광고, 구독, 좋아요.

---

## 18. 현재 구현 vs 기획 대조

| 기획 블록 | 지금 |
|-----------|------|
| 서비스 핵심 루프 (로컬) | `동작` |
| 서비스 핵심 루프 (MATCH/DM) | `코드`, 로그인·IAP 미연동 |
| 사업 BM ₩500 | 스키마+함수 `코드`, Play 미연결 |
| UI/UX | 화면 골격 `동작`~`코드`, 토큰 정합 진행 |
| 기능 명세 | 이 문서. 코드와 불일치(FOLLOW unfollow, IAP 패키지) |
| IA | 라우트 존재 |
| 데이터 | 마이그레이션 존재, 운영 데이터 없을 수 있음 |
| 시스템 | Supabase 선택 고정. Google/IAP 네이티브 빠짐 |
| 콘텐츠 | 카피 테이블 있음. 약관 없음 |
| 정책 | 구멍 (탈퇴, 신고, 연령) |
| 운영 | 대시보드만 |
| GTM | 미착수 |
| 분석 | 이벤트 미심음 |
| 수익화 | 설계만 |
| 보안 | RLS/스토리지 설계 `코드`, 법적 문서 없음 |
| QA | 수동 Android 위주 |
| 출시 | 1.0.0 번호만 있음 |
| 성장 | 의도적 제한이 전략 |

---

## 19. 다음 결정이 필요한 것 (기획 부채)

1. Play에 **로컬 로그만** 낼지, MATCH 카피를 숨길지.  
2. `can_send` 양방향 결제 규칙.  
3. 탈퇴 유예 vs 즉시.  
4. 만 14세/19세.  
5. TAKE soft delete.  
6. 배경색 `#0B0B0B` vs 현재 `pantone.fusion`.  
7. OPEN 리스트 FOLLOW에 unfollow 넣을지.  
8. city에 위경도 저장 여부.  
9. 분석 툴 1개.  
10. 앱 버전을 0.1로 내릴지.

이 10개가 닫히기 전에 “소셜 기능 개발 완료”라고 쓰지 않는다.
