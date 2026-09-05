# HEXy Android 개발 — 다른 PC에서 이어하기

Jelly UI는 **Expo Go가 아니라 개발 빌드(dev client)** 에서만 동작합니다.

---

## 0. 새 PC 최초 1회

```bash
git clone <repo-url>
cd hexy
npm install
```

`.env` 복사 (`.env.example` 참고):

```bash
# Windows PowerShell — 파일을 직접 복사하거나 편집
copy .env.example .env
```

`android/` 폴더는 git에 없습니다. 네이티브 프로젝트 생성:

```bash
npm run prebuild:android
```

개발 빌드 APK를 폰에 **처음 설치** (USB 연결 권장):

```bash
npm run android
```

> 이미 다른 PC에서 만든 개발 빌드 APK가 폰에 있고, **JS만** 바꿀 때는 `npm run android` 생략 가능.

---

## 1. 매일 작업 시작 (공통)

```bash
cd hexy
npm install          # package.json 바뀌었을 때만
npm start            # = expo start --dev-client
```

폰에서 **HEXy 개발 빌드 앱** 실행 → Metro에 연결.

| 변경 내용 | 필요한 명령 |
|---|---|
| JS / TS / Jelly DOM 컴포넌트만 | `npm start` |
| `expo-dev-client`, `@expo/dom-webview`, `app.config.ts` plugins 등 네이티브 변경 | `npm run android` (재빌드) |

**Expo Go (`npm run start:go`)는 Jelly UI 안 됩니다.**

---

## 2. USB 연결

폰: **USB 디버깅** ON → PC에 USB 연결.

### 기기 확인

```bash
adb devices
```

`device` 한 줄이 보이면 OK.

### (선택) 포트 리버스 — 연결 안 될 때

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:19000 tcp:19000
```

### 개발 서버 + 앱

**터미널 1** — Metro:

```bash
npm start
```

**처음 설치 / 네이티브 변경 후** — **터미널 2**:

```bash
npm run android
```

USB면 Metro가 보통 `localhost`로 잡혀서 **같은 Wi‑Fi 없이도** 동작합니다.

---

## 3. 같은 Wi‑Fi (무선)

PC와 폰을 **같은 Wi‑Fi**에 연결. USB 없이 개발할 때.

### Metro (LAN)

```bash
npm start
```

LAN이 안 잡히면:

```bash
npx expo start --dev-client --lan
```

터미널에 나오는 URL 예: `exp+hexy://expo-development-client/?url=http://192.168.x.x:8081`

### 폰에서 연결

1. 개발 빌드 앱 실행
2. 최근 서버가 안 보이면 **Enter URL manually** → 위 `http://192.168.x.x:8081` 입력

### Wi‑Fi에서 안 붙을 때

- PC 방화벽에서 **8081** 허용
- VPN 끄기 (PC·폰 둘 다)
- 공유기 **AP 격리**(게스트 Wi‑Fi) 끄기 — 같은 SSID인데 기기 간 통신이 막히는 경우

### (선택) Wi‑Fi ADB — USB 없이 `run:android`까지

USB로 한 번 연결된 상태에서:

```bash
adb tcpip 5555
adb connect <폰_IP>:5555
adb devices
npm run android
```

이후 USB 뽑고 Wi‑Fi로 adb + Metro 사용 가능.

---

## 4. 빠른 참조

```bash
# 일상 (JS만)
npm start

# 네이티브 재빌드 + 설치
npm run android

# android/ 다시 생성 (플러그인·prebuild 설정 변경 후)
npm run prebuild:android

# Expo Go — Jelly UI 미지원, 일반 확인용만
npm run start:go
```

### EAS 클라우드로 개발 APK (로컬 Android SDK 없을 때)

```bash
npx eas-cli build --profile development --platform android
```

빌드된 APK 설치 후, 이 PC에서는 `npm start`만으로 이어서 개발.

---

## 5. 체크리스트

- [ ] `.env` 있음
- [ ] 폰에 **개발 빌드** 설치됨 (Expo Go 아님)
- [ ] `npm start` 후 개발 빌드 앱에서 연결
- [ ] USB: `adb devices` → `device`
- [ ] Wi‑Fi: 같은 네트워크, PC IP로 수동 URL 가능
