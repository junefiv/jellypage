# HEXy Android 개발 — 다른 PC에서 이어하기

Jelly UI는 **Expo Go가 아니라 개발 빌드(dev client)** 에서만 동작합니다.

같은 Wi‑Fi는 **Metro(JS)** 용입니다. APK를 깔거나 네이티브를 다시 심을 때는 **ADB**가 필요합니다. ADB는 USB이거나, USB 없이 **무선 디버깅**이거나, 둘 중 하나입니다.

---

## 0. 새 PC 최초 1회

필요한 것: Node, Android SDK (`platform-tools`의 `adb`), 폰(개발자 옵션).

```bash
git clone <repo-url>
cd jelly-page
npm install
```

`postinstall`이 `patches/expo+57.0.20.patch`를 적용합니다. 지우지 마세요. (Android cold start `DomWebView.injectJavaScript` tag 에러 수정. JS만, 재빌드 불필요.)

`.env` 복사 (`.env.example` 참고):

```powershell
copy .env.example .env
```

`android/` 폴더는 git에 없습니다. 네이티브 프로젝트 생성:

```bash
npm run prebuild:android
```

Windows에서 `adb`가 안 되면 PATH에 넣거나 전체 경로를 씁니다.

```
%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe
```

개발 빌드 APK를 폰에 **처음 설치**하려면 ADB가 `device`여야 합니다. USB가 없으면 **§2 무선 디버깅** 후:

```bash
npm run android
```

이미 다른 PC에서 만든 **같은 개발 빌드**가 폰에 있고 JS만 이을 때는 설치를 건너뛰고 **§1**만 하면 됩니다.

셔터음 파일: `assets/sounds/shutter-boing.wav`. 없으면:

```bash
node scripts/gen-shutter-boing.mjs
```

촬영 시 시스템 셔터는 끄고 (`shutterSound: false`) 이 wav를 `expo-audio`로 재생합니다. `Cannot find native module 'ExpoAudio'`가 나면 APK에 모듈이 없는 것입니다. 파일만 넣는다고 안 사라지고 **`npm run android`로 재설치**해야 합니다.

---

## 1. 매일 작업 시작 (공통)

APK가 이미 폰에 있을 때. USB·무선 ADB 필요 없음. PC와 폰은 **같은 Wi‑Fi**.

```bash
cd jelly-page
npm install          # package.json 바뀌었을 때만
npm start            # = expo start --dev-client  (npx start 는 안 됨)
```

폰에서 **HEXy 개발 빌드** 실행 → QR 스캔. 안 되면 **Enter URL manually**에 Metro URL.

예: `http://10.20.1.89:8081`  
터미널에 `exp+hexy://expo-development-client/?url=...` 형태로도 나옵니다.

그 터미널에서 `r` = 리로드. JS/TS/Jelly DOM만 고치면 저장 후 `r`.

| 변경 내용 | 필요한 명령 |
|---|---|
| JS / TS / Jelly DOM / `patches/` | `npm start` + `r` |
| `expo-audio` 등 네이티브 모듈, `expo-dev-client`, `@expo/dom-webview`, `app.config.ts` plugins | ADB 연결 후 `npm run android` |

**Expo Go (`npm run start:go`)는 Jelly UI 안 됩니다.**

LAN이 안 잡히면:

```bash
npx expo start --dev-client --lan
```

Wi‑Fi에서 Metro가 안 붙을 때:

- PC 방화벽 **8081** 허용
- VPN 끄기 (PC·폰)
- 공유기 **AP 격리**(게스트 Wi‑Fi) 끄기

---

## 2. 무선 디버깅 — USB 없이 APK 설치

Android 11+ . USB 한 번도 없어도 됩니다. `npm run android` / `adb install` 할 때만 필요합니다.

**PC를 바꾸면** 다른 PC에서 했던 무선 연결은 이어지지 않습니다. 새 PC에서 **§2.2 페어링**을 다시 해야 합니다.

### 2.1 폰에 IP:포트가 **두 개** — 헷갈리지 말 것

무선 디버깅 화면에는 **서로 다른** IP:포트가 두 군데 있습니다.

| 어디서 보이나 | 쓰는 명령 | 역할 |
|---|---|---|
| **페어링 코드로 기기 페어링** 창 | `adb pair` | 이 PC를 폰에 신뢰 등록 (PC마다 1회) |
| 무선 디버깅 **첫 화면** (페어링 창 닫으면) | `adb connect` | 실제 ADB 연결 (설치·빌드용) |

**포트 번호가 다릅니다.** 페어링 포트로 `adb connect` 하거나, 연결 포트로 `adb pair` 하면 실패합니다.

예 (같은 폰, 같은 날):

- 페어링: `192.168.219.106:32857` + 코드 `042611`
- 연결: `192.168.219.106:34785` (`39147`은 연결 거부 — 포트가 바뀐 것)

### 2.2 PC — 순서대로 (PowerShell)

이 PC는 `adb`가 PATH에 없습니다. **맨 위 `$adb = ...` 한 줄을 먼저** 실행하세요. 그다음부터는 `$adb`만 씁니다.

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

# 0) ADB 상태 초기화 (protocol fault 나면 필수)
& $adb kill-server
& $adb start-server

# 1) 페어링 — 폰: 「페어링 코드로 기기 페어링」 창을 열어둔 상태
& $adb pair <페어링_IP>:<페어링_포트> <6자리코드>
# 예: & $adb pair 192.168.219.106:32857 042611

# 2) 연결 — 페어링 창 닫고, 무선 디버깅 첫 화면의 IP:포트
& $adb connect <연결_IP>:<연결_포트>
# 예: & $adb connect 192.168.219.106:34785

# 3) 확인 — 아래에 device 한 줄
& $adb devices -l
```

`device`가 보이면:

```powershell
cd C:\jellypage
npm run android
```

이미 APK만 다시 깔 때:

```powershell
& $adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

### 2.3 `protocol fault` — pair가 실패할 때

`adb pair` 후 이런 메시지가 나오면 **명령 형식은 맞을 수 있습니다** (ADB 35.x 알려진 버그):

```
error: protocol fault (couldn't read status message): No error
```

**같은 pair 명령을 한 번 더** 실행하세요. 대부분 두 번째에 성공합니다.

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb kill-server
& $adb start-server
& $adb pair <페어링_IP>:<페어링_포트> <6자리코드>
# 실패하면 같은 줄을 다시 실행
```

그래도 안 되면:

- 페어링 창이 **열려 있는지**, 코드가 **만료되지 않았는지** 확인 (창 닫고 새로 열기)
- PC·폰 **같은 Wi‑Fi**
- 폰 **VPN 끄기**
- (삼성 등) Wi‑Fi 설정 → **MAC 주소 무작위화** 끄기
- 개발자 옵션에서 **USB 디버깅**도 ON (일부 기기)

### 2.4 `adb connect` 연결 거부 — 포트를 못 찾을 때

`연결을 거부했으므로 연결하지 못했습니다` / `offline` → **연결용 포트가 바뀐 것**입니다. 페어링은 성공했어도 connect는 **메인 화면 포트**로 다시 해야 합니다.

페어링 후 PC가 포트를 찾아주는 방법:

```powershell
adb mdns services
```

출력 예:

```
adb-R3CY60F98SX-nq2u7B  _adb-tls-connect._tcp  192.168.219.106:34785
```

여기 나온 **가장 최근 `_adb-tls-connect` 포트**로 connect:

```powershell
adb connect 192.168.219.106:34785
adb devices -l
```

여러 줄이 나오면 하나씩 시도. `device`가 되는 포트를 씁니다.

### 2.5 끊김

무선 디버깅은 화면이 꺼지거나 잠깐 두면 포트가 바뀌고 `offline` / 연결 거부가 납니다. `npm run android` 하는 동안 폰 화면을 켜 두세요.

다시 붙을 때:

1. 페어링은 **보통 다시 안 함** (같은 PC)
2. 무선 디버깅 첫 화면에서 **새 연결용 IP:포트** 확인
3. `adb connect <새_포트>` 또는 `adb mdns services` → connect

`adb devices`가 비어 있으면 `npm run android`는 항상 `No Android connected device` 로 실패합니다.

---

## 3. USB 연결

폰: **USB 디버깅** ON → USB 연결.

```bash
adb devices
```

`device` 한 줄이면 OK.

연결이 안 될 때:

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:19000 tcp:19000
```

USB면 Metro가 `localhost`로 잡혀 **같은 Wi‑Fi 없이도** JS가 붙습니다. 설치는 여전히 `npm run android`.

구형 무선 ADB (USB로 한 번 켠 뒤 Wi‑Fi로 전환):

```bash
adb tcpip 5555
adb connect <폰_IP>:5555
```

Android 11+는 **§2**가 더 맞습니다.

---

## 4. Windows 첫 빌드가 깨질 때

`No Android connected device` → `adb devices`가 비어 있음. §2 페어링·연결 또는 §3 USB.

`npx start` / `could not determine executable` → `npm start` 사용 (§1).

경로 260자 (`Filename longer than 260 characters`, 종종 `react-native-worklets` CMake):

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = "C:\g"
$env:Path = "$env:ANDROID_HOME\platform-tools;$env:Path"
npm run android
```

또는 APK만 다시 만들 때:

```powershell
cd android
$env:GRADLE_USER_HOME = "C:\g"
.\gradlew.bat app:assembleDebug -x lint -x test --build-cache -PreactNativeArchitectures=arm64-v8a
```

산출물: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 5. 빠른 참조

```bash
# 일상 (JS만) — QR / r
npm start

# 네이티브 재빌드 + 설치 (ADB 필요)
npm run android

# android/ 다시 생성
npm run prebuild:android

# 셔터 wav
node scripts/gen-shutter-boing.mjs

# Expo Go — Jelly UI 미지원
npm run start:go
```

로컬 SDK가 없을 때:

```bash
npx eas-cli build --profile development --platform android
```

APK 설치 후 그 PC에서는 `npm start`만.

---

## 6. 체크리스트

- [ ] `.env` 있음
- [ ] `npm install` 후 patch 적용됨
- [ ] `assets/sounds/shutter-boing.wav` 있음
- [ ] 폰에 **개발 빌드** 설치됨 (Expo Go 아님)
- [ ] 일상: `npm start` → QR 또는 `http://<PC_IP>:8081`
- [ ] 설치/재빌드: `adb devices` → `device` (USB 또는 무선 디버깅)
- [ ] 무선: `adb pair`(페어링 창) → `adb connect`(첫 화면 또는 `adb mdns services`)
- [ ] `protocol fault` → `adb kill-server` 후 pair **재시도**
- [ ] 설치 중 폰 화면 유지
