# HEXy Android 개발 — 다른 PC에서 이어하기

Jelly UI는 **Expo Go가 아니라 개발 빌드(dev client)** 에서만 동작합니다.

같은 Wi‑Fi는 **Metro(JS)** 용입니다. APK를 깔거나 네이티브를 다시 심을 때는 **ADB**가 필요합니다. ADB는 USB이거나, USB 없이 **무선 디버깅**이거나, 둘 중 하나입니다.

---

## 0. 새 PC 최초 1회

필요한 것: Node, Android SDK (`platform-tools`의 `adb`), 폰(개발자 옵션).

```bash
git clone <repo-url>
cd jellypage
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
cd jellypage
npm install          # package.json 바뀌었을 때만
npm start            # = expo start --dev-client
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

### 폰

1. 설정 → 휴대전화 정보 → **빌드번호** 7번 탭
2. 개발자 옵션 → **무선 디버깅** ON
3. **페어링 코드로 기기 페어링** → IP:포트 + 6자리 코드
4. 페어링 창을 **닫지 말고** 무선 디버깅 **첫 화면**의 IP:포트도 확인 (숫자가 다름)

페어링용 포트와 연결용 포트는 다릅니다. 예: 페어링 `10.20.1.88:44791`, 연결 `10.20.1.88:39147`.

### PC

```powershell
adb pair <페어링_IP>:<페어링_포트> <6자리코드>
adb connect <연결_IP>:<연결_포트>
adb devices
```

`device`가 보이면:

```bash
npm run android
```

이미 APK만 있으면:

```powershell
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

### 끊김

무선 디버깅은 화면이 꺼지거나 잠깐 두면 포트가 바뀌고 `offline` / 연결 거부가 납니다. 설치하는 동안 폰을 켜 두고 무선 디버깅 화면을 닫지 마세요. 다시 붙을 때는 **연결용 IP:포트만** 다시 받아 `adb connect` 하면 됩니다. 페어링은 보통 한 번이면 됩니다.

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

`No Android connected device` → ADB가 없음. §2 또는 §3.

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
- [ ] 무선: 페어링 포트 ≠ 연결 포트, 설치 중 화면 유지
