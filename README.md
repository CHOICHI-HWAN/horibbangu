# 🐾 호리빵구 체중기록

반려동물(호야, 보리, 건빵, 살구, 로이, 삼식, 삼순)의 체중을 기록하고 추이를 보는 웹 앱입니다.
배포 주소: https://horibbangu.web.app

## 기능

- **빠른 입력**: `호야, 4.40` 처럼 입력하면 오늘 날짜로 저장 (`호야 4.4, 보리 6.0`, `2026.10.20 호야 4.4`, `보리 5.76?` 도 가능)
- **아이별 보기**: 카드를 한 번 누르면 그 아이의 그래프·기록과 최근 5회 이동평균 표시, 두 번 누르면 오늘 체중 입력
- **평균·이상치**: 아이별 평균선과 평균에서 많이 벗어난 값을 표시
- **기록 관리**: 추가/수정/삭제, 아이 추가·이름·색 변경, CSV·JSON 내보내기, JSON 가져오기
- **고양이 친구들**: 아이마다 한 마리씩 화면 아래에서 자고, 마우스를 움직이면 귀를 쫑긋하고, 가끔 커서를 사냥하거나 식빵을 굽고 골골송을 부르고 술래잡기를 함 (누르면 그 아이 기록으로 이동, 🐱 버튼으로 끄기). 그루밍, 쿠션 꾹꾹이, 캣타워 점프·기둥 스크래칭·캣휠 달리기도 함. 양쪽 캣타워와 해먹·판자·로프 다리, 경사로를 오르내리며 곳곳을 우다다 뛰어다님
- **아이들의 취향**: 보리는 봉지·박스·소파, 살구는 바구니·뒤집기, 호야는 턱을 괴고 잠자기. 로이도 사진의 장모와 흰 가슴털을 반영. 곳곳의 가구와 호야의 투명해먹으로 찾아가 쉬고, 로이와 동글이는 가끔 날개로 날아다님. 동글이는 체중기록 없이 화면에서 함께하는 친구로 등장
- **동기화**: Google 로그인 + Firestore로 여러 기기에서 실시간 공유

## 구조

| 파일 | 설명 |
|---|---|
| `index.html` | 생성된 공개 고양이 방 (로그인 없음) |
| `records.html` | 체중 기록과 공유 고양이 엔진 원본 |
| `room/` | 고양이 방 풍경·가구·이벤트 원본 |
| `desktop/windows/` | 투명 데스크톱 창·트레이·오프라인 패키징 |
| `scripts/build-room.py` | 공개 고양이 방 생성 |
| `config.js` | Firebase 웹 설정값 (비워두면 이 기기에만 저장) |
| `firestore.rules` | 허용한 이메일만 읽기/쓰기 |
| `CHANGELOG.md` | 버전별 변경 내역 |
| `firebase.json` | Firebase Hosting / Firestore 설정 |

## 개발·배포

`python3 scripts/build-room.py`로 첫 화면을 갱신합니다. 생성 후 `index.html`은 외부 의존성 없이 브라우저에서 바로 동작합니다.

```bash
# 배포 (Firebase CLI 필요: npm install -g firebase-tools, firebase login)
firebase deploy --only hosting            # 화면 변경
firebase deploy --only firestore:rules    # 접근 허용 이메일 변경
```

## 접근 권한

`firestore.rules`의 이메일 목록에 있는 Google 계정만 데이터를 읽고 쓸 수 있습니다.
계정을 추가하려면 목록을 수정하고 규칙을 다시 배포하세요.

`config.js`의 Firebase 키는 공개되어도 되는 웹 설정값이며, 데이터는 위 규칙으로 보호됩니다.

## 버전 관리

버전 번호는 `MAJOR.MINOR.PATCH` 형식입니다. 새 버전을 낼 때는 아래 순서로 합니다.

1. `records.html`의 `VERSION`과 `CHANGELOG.md`를 수정하고 방과 로컬 실행 파일 재생성
2. 커밋 후 태그 생성: `git tag -a v1.1.0 -m "v1.1.0"`
3. `git push && git push --tags`
4. `firebase deploy --only hosting`

앱 화면 맨 아래에 현재 버전이 표시됩니다.

## 놀이터 동작 검사

Playwright가 설치된 개발 환경에서 `node tests/playground.cjs`를 실행합니다.
`PLAYWRIGHT_MODULE`로 모듈 경로, `BROWSER_EXECUTABLE`로 설치된 Chromium 계열 브라우저 경로를 지정할 수도 있습니다.
검사는 별도 브라우저 세션에서 실행하며 Firebase 연결을 차단하고 실제 체중기록을 저장하지 않습니다.

## Windows 바탕화면 친구들 (3.0)

[Firebase 직접 다운로드](https://horibbangu.web.app/releases/Horibbangu-Windows.zip)에서 ZIP을 받고 **폴더 전체를 압축 해제한 뒤 `호리빵구/호리빵구.exe`**를 실행합니다. EXE만 따로 옮기면 동작하지 않습니다. 바탕화면 바로가기는 만들 수 있습니다.

Windows 실행본은 호수·하늘·벽·바닥 없이 고양이와 가구·그림·시계·달력만 투명한 바탕화면 위에 표시합니다. 제목 표시줄과 테두리가 없고 빈 공간은 클릭이 아래 프로그램으로 통과합니다. 고양이 클릭·공기방울 드래그와 기존 행동은 유지하며, 호수가 없는 데스크톱 모드에서는 풍경 감상 행동을 사용하지 않습니다. 웹앱은 기존 호수 배경을 유지합니다.

알림 영역의 고양이 아이콘을 클릭하면 메뉴가 열리고 오른쪽 클릭하면 숨김·항상 위·친구 초대·종료를 선택할 수 있습니다. 항상 위는 기본 꺼짐입니다. `Ctrl+Alt+H`는 메뉴, `Ctrl+Alt+Q`는 종료입니다. 인터넷·로그인·체중 기록·별도 브라우저 설치는 필요하지 않습니다. 설정은 `%APPDATA%\HoribbanguDesktop`에 저장됩니다.

실행 환경은 [Electron 투명 창](https://www.electronjs.org/docs/latest/tutorial/custom-window-styles)과 [클릭 통과 API](https://www.electronjs.org/docs/latest/tutorial/custom-window-interactions)를 사용합니다. `main.cjs`가 네이티브 창과 트레이를 담당하고 `preload.cjs`가 제한된 IPC만 제공합니다. 렌더러는 sandbox/contextIsolation을 사용하며 Node·외부 네트워크·외부 탐색을 허용하지 않습니다.

최초 빌드 전 Node.js에서 `npm ci`로 고정된 esbuild를 설치합니다. 재빌드는 Node.js·Python 3 환경에서 `desktop/windows/build.sh`를 실행합니다. `runtime-lock.json`에 고정한 공식 Windows x64 런타임 ZIP을 SHA-256으로 확인한 뒤 앱 파일과 함께 패키징합니다. `HORIBBANGU_ELECTRON_CACHE`로 런타임 캐시 위치를 지정할 수 있습니다. 기본값은 `/tmp/horibbangu-build/electron`입니다. ZIP과 실행 폴더는 Git에서 제외되고 공개 ZIP·체크섬만 `releases/`를 통해 Firebase에 배포됩니다.

`test_binary.py`는 공식 런타임 일치·PE 형식·필수 파일·앱 파일 일치를 확인합니다. `tests/desktop.cjs`는 실제 Electron 창에서 투명 렌더링·IPC·드래그·메뉴를 검증합니다 (`ELECTRON_EXECUTABLE`, `PLAYWRIGHT_MODULE` 지정). Mac에서 앱 구조를 검증했으며 Windows 실기기의 투명 합성과 클릭 통과는 아직 미확인입니다. 실행파일은 코드 서명이 되어 있지 않습니다.

## 고양이 방 (2.2)

`index.html`은 로그인·체중 데이터·외부 요청이 없는 고양이 방입니다. 기본 화면은 고양이와 풍경만 표시합니다. 빈 공간을 탭하면 조작·로그인·날씨 버튼이 나타나고 다시 탭하면 닫힙니다. 키보드는 Tab으로 조작을 표시하고 Escape로 닫을 수 있습니다. 고양이 쓰다듬기·드래그와 메뉴 조작은 화면 숨김 토글과 구분됩니다.

체중 기록은 메뉴의 로그인 링크로 `records.html`에 들어가면 됩니다. 기존 Firebase 인증·저장 키·Firestore 컬렉션을 유지합니다. 카드 한 번 탭은 그래프, 두 번 탭은 입력이며 점선은 최근 5회 이동평균입니다.

방의 원본은 `room/shell.html`, `room/room.css`, `room/room.js`, `room/cats-extra.css`입니다. 고양이 엔진과 체중 기록은 `records.html`이 원본이며 수정 후 `python3 scripts/build-room.py`로 첫 화면을 생성합니다. 생성된 `index.html`을 직접 편집하지 마세요.

할슈타트 그림은 프로젝트 전용으로 생성한 `room/assets/hallstatt-painted.webp`를 내장합니다. 고양이는 개별 사진의 무늬를 유지하는 SVG와 부드러운 셀 채색으로 표현합니다. 주황색 문과 방문 손님·버스·급식·도토리 이벤트는 제거했습니다.

해·달과 벽시계는 기기 현지 시간을 사용합니다. 해·달은 6시/18시를 기준으로 움직이는 연출이며, 자동 날씨는 반시간 단위 가상 날씨입니다. 실제 기상 정보나 위치를 요청하지 않습니다. 동작 줄이기를 존중하면서 사용자가 메뉴에서 움직임을 켤 수 있습니다.

크기는 최근 양수 체중의 세제곱근에 사진 기준 체형을 곱해 0.82~1.42배로 제한합니다. 동글이와 로이는 사진 기준 체형을 유지합니다. 공개 화면에는 빌드 시 기본 기록의 크기 비율만 들어갑니다. 기록 페이지에서 동기화한 기기는 최신 크기 비율을 방에 전달합니다. 다른 기기의 최신 서버 크기를 반영하려면 그 기기에서 기록 페이지를 한 번 동기화해야 합니다.

`desktop/windows/build.sh`는 같은 고양이 엔진에서 기록 링크와 방 배경을 제거한 투명 데스크톱 앱을 생성합니다. 생성된 실행 파일과 ZIP은 로컬 `downloads/` 폴더에 보관하며, Firebase용 ZIP과 체크섬을 `releases/`에 복사합니다. 공개 ZIP은 Firebase Hosting과 GitHub Releases에 배포합니다. Windows 실기기 실행은 아직 미확인입니다.

검사: `tests/room.cjs`(공개 화면·터치/키보드 메뉴·시간·날씨·행동·모바일 입력), `tests/room-routes.cjs`(전체 타워/발판 이동), `tests/playground.cjs`(기록 페이지 엔진), `tests/offline-playground.cjs`(오프라인), `tests/sizes.cjs`(체중과 크기 전달), `node tests/sync.cjs`(저장 중 재수정). 브라우저 검사는 `PLAYWRIGHT_MODULE`, 필요하면 `BROWSER_EXECUTABLE` 환경 변수를 지정합니다.

소양(러시안블루)과 소미(치즈 태비 코리안숏헤어)는 박박사님 댁의 방문 친구이며, 팡이(분홍빛 피부와 큰 귀)도 함께 방문합니다. 방을 연 뒤 45~90초에 처음 찾아와 2~3분 놀고, 5~8분 쉬었다 다시 방문합니다. 빈 곳을 탭해 **친구 초대**를 누르면 바로 만날 수 있습니다. 숨긴 탭·고양이 숨김·움직임 쉬기 중에는 방문 시간이 흐르지 않으며, 체중 기록에는 추가되지 않습니다.

고양이 시계 아래의 문페이즈는 현재 기기 날짜에 맞춰 갱신됩니다. [NASA 월상표](https://eclipse.gsfc.nasa.gov/phase/phases1901.html)의 2000-01-06 18:14 UTC 새달과 평균 삭망월 29.530588일을 바탕으로 한 장식용 근사치입니다. 정밀 천문 시각을 계산하는 용도는 아닙니다.

## JavaScript 컴파일과 성능 검사 (3.1)

`records.html`과 `room/`는 읽기 쉬운 원본입니다. `npm run build` 또는 Firebase Hosting의 predeploy에서 `scripts/build-hosting.py`가 인라인 JavaScript를 고정 버전 esbuild로 컴파일·압축한 뒤 `site/`에 배포할 여섯 파일만 만듭니다. `site/`와 `build/`는 생성물이며 Git에 넣지 않습니다. 소스맵·빌드 도구·원본 사진·개발 파일은 Hosting에 포함되지 않습니다.

데스크톱의 renderer는 `playground.js`로 컴파일하고 엄격한 로컬 CSP로 불러옵니다. main/preload도 패키징할 때 컴파일합니다. Electron은 V8 코드 캐시 정책을 사용합니다. esbuild는 JavaScript 변환·압축 도구이며 네이티브 코드로 바꾸는 것은 아닙니다. 실제 실행 비용은 위치·크기 DOM 쓰기 생략, 발판 조회 캐시, 물결의 좁은 이미지 영역 그리기와 Canvas 재사용, 날씨 30fps 및 맑은 날 중복 그리기 제거로 줄였습니다.

`tests/performance.cjs`는 같은 1440×960 화면·고양이 8마리·5회 중앙값으로 정지/걷기 틱을 측정하고, 물결 180프레임 평균도 진단용으로 측정합니다. Canvas의 비동기 GPU 처리 편차가 커서 이 물결 수치는 속도 개선 판단에 사용하지 않습니다. CPU 처리 구간의 마이크로벤치마크이며 전체 앱 FPS나 Windows 성능의 보장은 아닙니다. `BENCH_OUT`으로 결과 JSON을 저장하고 `HORI_SITE_DIR`로 컴파일 배포 폴더를 지정할 수 있습니다. JavaScript 크기는 `build/compile-report.json`에 기록됩니다. 귀 정렬과 귀 밑동 고정축은 `tests/ears.cjs`가 11마리·6가지 자세에서 검사합니다.

2026-10-23 macOS/Brave headless에서 v3.0.0 원본과 3.1 컴파일 배포본을 같은 조건으로 비교했습니다. 정지 틱은 약 0.00533→0.00100ms, 걷기 틱은 약 0.00656→0.00444ms였습니다. 프레임당 위치·크기 transform 쓰기는 정지 16→0회, 걷기 16→8회로 줄었습니다. 이 구간의 CPU 비용 감소이며 전체 앱 FPS 향상률로 해석하지 않습니다.
