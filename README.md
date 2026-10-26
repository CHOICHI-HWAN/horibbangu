# 🐾 호리빵구 체중기록

반려동물(호야, 보리, 건빵, 살구, 로이, 삼식, 삼순)의 체중을 기록하고 추이를 보는 웹 앱입니다.
배포 주소: https://horibbangu.web.app

## 개발자·라이선스

기획·제작·운영: **호리빵구 프로젝트 제작자**. 실명·소속·공개 연락처는 아직 지정하지 않았습니다.
프로젝트 소개와 앱에 사용할 짧은 문구는 [개발자 소개](ABOUT.md)에 정리했습니다.

**개인 감상·실행은 허용하지만 코드·그림 재사용, 수정본 배포, 재판매·재호스팅에는 사전 서면 허락이 필요합니다.**
이 저장소는 범용 재사용을 허락하는 오픈소스 라이선스를 부여하지 않습니다.
출처를 표시하거나 비상업적으로 쓴다는 사정만으로 재사용이 허용되지는 않습니다.

전체 조건은 [LICENSE](LICENSE), 쉬운 설명은 [이용 정책](legal/USAGE_POLICY.md)을 확인하세요.
외부 오픈소스, 공공영역, 이용자 본인 자료, 법령상 허용 이용과 플랫폼 약관상의 권리는
각 조건을 따릅니다. [외부 소프트웨어 고지](THIRD_PARTY_NOTICES.md)는 그 구분을 설명합니다.
이 정책은 적법하게 통제하는 권리에만 적용되며, 기존 허락을 소급 취소하거나 복제를 기술적으로 차단하지 않습니다.

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

## Windows 바탕화면 배경 (3.5.0)

[Firebase 직접 다운로드](https://horibbangu.web.app/releases/Horibbangu-Windows-v3.5.0.zip)에서 `호리빵구-v3.5.0.exe` 하나를 꺼내 실행합니다. ZIP은 약 0.76 MB이며 Windows 10/11 x64와 공유 Microsoft Edge WebView2 런타임을 사용합니다. 고양이와 풍경은 EXE에 내장되어 인터넷·로그인·체중 기록 없이 감상할 수 있습니다.

**기본은 바탕화면 배경 모드입니다.** 모든 클릭은 바탕화면과 프로그램으로 통과합니다. 트레이에서 **항상 위에 · 고양이 클릭/드래그**를 선택하거나 화면 설정에서 같은 항목을 체크하면 다른 창 위에서 고양이와 화면 버튼을 조작할 수 있습니다. 빈 공간은 이 모드에서도 클릭을 통과시킵니다. 트레이의 **고양이 메뉴 열기 / 접기**로 화면 버튼을 열 수 있습니다.

고양이·버튼 영역만 받는 별도 입력 창을 사용하며 전역 마우스 훅은 없습니다. **바탕화면 배경 · 클릭 통과**로 돌아가면 드래그를 끝내고 입력 창을 숨깁니다. 모드 선택은 별도 `InteractiveTop` 설정으로 저장하며 예전 `Layer=1` 값만으로 자동 켜지지 않습니다. 화면보호기는 기존처럼 입력 시 종료하며 조작 모드를 켜지 않습니다.

시계 옆 고양이 트레이 아이콘을 클릭하거나 우클릭해 배경 켜기/끄기·숨기기·모니터·투명도·휴식·풍경 감상·움직임·날씨를 조절합니다. 기본판에서는 친구 초대와 날개 친구들도 선택할 수 있습니다. `Ctrl+Alt+H`는 화면 설정, `Ctrl+Alt+Q`는 종료입니다. 모니터와 투명도(0~80%)는 저장되고, 모니터 분리 시 주 모니터로 대체합니다.

이전 EXE가 실행 중이면 먼저 트레이에서 종료한 뒤 새 버전을 실행해야 합니다. 사용자 설정은 `%LOCALAPPDATA%\HoribbanguDesktop`, 내장 파일은 그 안의 `Native\3.5.0`에 보관합니다. WebView2 프로필은 그대로 유지합니다. 코드 서명은 없습니다. 기존 3.2.1 Electron 호환판은 이전 입력 방식을 사용하므로 현재 다운로드 메뉴에서 제외했습니다.

재빌드는 `desktop/windows/build.sh`입니다. `native/test_binary.py`는 EXE·내장 파일·라이선스·DPI/권한 선언을 검사합니다. Windows CI는 기본판과 두 개별판에서 배경 모드 클릭 통과·이전 설정 이관·모니터/투명도·트레이 명령·설정 유지와 실제 Explorer 바탕화면의 임시 바로가기를 검사합니다. `test_desktop_probe.cpp`는 이 CI 검사에만 사용하며 배포 ZIP에는 포함하지 않습니다.

항상 위에 모드의 실제 창 표시·빈 공간 클릭 통과·고양이 클릭·공기방울 드래그·드래그 중 배경 전환·설정 유지도 [3.5.0 Windows CI](https://github.com/CHOICHI-HWAN/horibbangu/actions/runs/40418753088)에서 기본판·박박사판·김박사판을 각각 검사해 통과했습니다.

## Windows 화면보호기 (3.5.0)

기존 고양이·호수 풍경을 그대로 사용하는 별도 화면보호기입니다. [기본판](https://horibbangu.web.app/releases/Horibbangu-Screensaver-v3.5.0.zip), [박박사판](https://horibbangu.web.app/releases/Horibbangu-Park-Screensaver-v3.5.0.zip), [김박사판](https://horibbangu.web.app/releases/Horibbangu-Kim-Screensaver-v3.5.0.zip)을 제공합니다. ZIP마다 버전이 표시된 `.scr` 파일 하나가 들어 있습니다.

ZIP을 풀고 계속 보관할 폴더에 `.scr`을 둔 뒤, 파일 우클릭 → 더 많은 옵션 표시 → 설치를 선택합니다. Windows 화면 보호기 설정에서 대기 시간과 **다시 시작할 때 로그온 화면 표시**를 선택하고 적용하세요. WebView2 Runtime이 필요합니다. 이 앱이 Windows 로그인·잠금 정책을 변경하지는 않습니다.

`/s`는 모든 모니터를 포함하는 가상 데스크톱 전체 화면, `/p HWND`는 Windows 설정 창 안의 작은 미리보기, `/c`는 설정 안내입니다. 전체 화면에서는 마우스·키보드 입력 시 종료합니다. 미리보기는 부모 창의 크기를 따르고 부모가 닫히면 종료합니다. 바탕화면판과 프로필·자원 폴더·실행 제한을 분리해 동시에 사용할 수 있습니다. 바탕화면판의 투명도와 배경 숨김 설정은 화면보호기에 적용하지 않습니다.

`native/test_screensaver.py`는 실제 Windows에서 전체 화면·입력 종료·미리보기·설정 호출·바탕화면판 동시 실행을 검사합니다. `native/test_saver_args.cpp`는 인수·창 핸들의 유효 범위와 잘못된 호출 거부를 검사합니다. 실물 다중 모니터 연결 배치는 별도 검사하지 않았습니다. 3.4.0의 기본판·박박사판·김박사판은 [Windows 실행 검사](https://github.com/CHOICHI-HWAN/horibbangu/actions/runs/40412237936)를 통과했습니다. 미리보기는 일반 WebView2 자식 창으로 그리고, 실제 픽셀을 검사해 빈 화면을 거릅니다.

## Windows 개별판 · 박박사 / 김박사

- [박박사판 다운로드](https://horibbangu.web.app/releases/Horibbangu-Park-Windows-v3.5.0.zip): 소양·소미만 처음부터 계속 함께합니다.
- [김박사판 다운로드](https://horibbangu.web.app/releases/Horibbangu-Kim-Windows-v3.5.0.zip): 팡이만 처음부터 계속 함께합니다.

ZIP과 내부 EXE 이름 모두 `v3.5.0`처럼 버전을 포함합니다. 다음 빌드에서도 `desktop/windows/package.json`의 버전으로 파일명을 자동 생성합니다. 예전 공유 주소도 버전이 붙은 다운로드 파일명을 제공합니다. 각 ZIP에는 해당 EXE 하나만 포함합니다. 기존 고양이 SVG·색상·체형과 방·호수 효과를 유지하며 다른 고양이를 자동 추가하거나 방문 후 퇴장시키지 않습니다. 체중 기록·로그인·네트워크 연결은 없습니다. Windows 10/11 x64와 공유 WebView2 런타임이 필요합니다. 기본판의 모니터 선택·투명도·배경 전환·항상 위에·배경 모드 클릭 통과 기능을 함께 사용합니다. 웹 첫 화면을 탭하면 두 다운로드 버튼이 나타납니다.

실행파일은 `downloads/호리빵구-박박사-v3.5.0.exe`, `downloads/호리빵구-김박사-v3.5.0.exe`에 보관합니다. 각 개별판은 창 클래스·단일 실행 잠금·트레이 이름·설정·WebView2 프로필을 분리하여 기본판 및 서로와 함께 실행할 수 있습니다. 설정 폴더는 `%LOCALAPPDATA%\HoribbanguDesktop-Park`, `%LOCALAPPDATA%\HoribbanguDesktop-Kim`입니다.

재빌드는 `python3 desktop/windows/build-editions.py`이며, `--edition park` 또는 `--edition kim`으로 렌더러·네이티브 빌드·패키징 단계를 각각 실행할 수도 있습니다. `tests/desktop-editions.cjs`는 기본판 방문 고양이와 SVG·색상·크기를 대조하고, 정확한 고양이 목록·장시간 방문 방지·오프라인 동작·배경·감상 전용 화면·웹 다운로드 링크를 검사합니다. Windows CI는 기본판·박박사판·김박사판을 각각 빌드하고 실제 창과 마우스 동작을 검사합니다. 3.3.2의 세 버전 실행 검증은 [Windows CI](https://github.com/CHOICHI-HWAN/horibbangu/actions/runs/40080294326)에서 통과했습니다. 실제 Explorer 아이콘 선택과 바로가기 실행, 클릭 통과, 투명 영역·투명도, 물결 갱신, 트레이 명령과 재실행을 검사했습니다. 검증한 EXE와 배포 ZIP의 내부 EXE가 같은지도 확인합니다.

## 고양이 방 (2.2)

`index.html`은 로그인·체중 데이터·외부 요청이 없는 고양이 방입니다. 기본 화면은 고양이와 풍경만 표시합니다. 빈 공간을 탭하면 조작·로그인·날씨 버튼이 나타나고 다시 탭하면 닫힙니다. 키보드는 Tab으로 조작을 표시하고 Escape로 닫을 수 있습니다. 고양이 쓰다듬기·드래그와 메뉴 조작은 화면 숨김 토글과 구분됩니다.

체중 기록은 메뉴의 로그인 링크로 `records.html`에 들어가면 됩니다. 기존 Firebase 인증·저장 키·Firestore 컬렉션을 유지합니다. 카드 한 번 탭은 그래프, 두 번 탭은 입력이며 점선은 최근 5회 이동평균입니다.

방의 원본은 `room/shell.html`, `room/room.css`, `room/room.js`, `room/cats-extra.css`입니다. 고양이 엔진과 체중 기록은 `records.html`이 원본이며 수정 후 `python3 scripts/build-room.py`로 첫 화면을 생성합니다. 생성된 `index.html`을 직접 편집하지 마세요.

할슈타트 그림은 프로젝트 전용으로 생성한 `room/assets/hallstatt-painted.webp`를 내장합니다. 고양이는 개별 사진의 무늬를 유지하는 SVG와 부드러운 셀 채색으로 표현합니다. 주황색 문과 방문 손님·버스·급식·도토리 이벤트는 제거했습니다.

해·달과 벽시계는 기기 현지 시간을 사용합니다. 해·달은 6시/18시를 기준으로 움직이는 연출이며, 자동 날씨는 반시간 단위 가상 날씨입니다. 실제 기상 정보나 위치를 요청하지 않습니다. 동작 줄이기를 존중하면서 사용자가 메뉴에서 움직임을 켤 수 있습니다.

크기는 최근 양수 체중의 세제곱근에 사진 기준 체형을 곱해 0.82~1.42배로 제한합니다. 동글이와 로이는 사진 기준 체형을 유지합니다. 공개 화면에는 빌드 시 기본 기록의 크기 비율만 들어갑니다. 기록 페이지에서 동기화한 기기는 최신 크기 비율을 방에 전달합니다. 다른 기기의 최신 서버 크기를 반영하려면 그 기기에서 기록 페이지를 한 번 동기화해야 합니다.

`desktop/windows/build.sh`는 같은 고양이 엔진에서 기록 링크를 제거하고 배경을 전환할 수 있는 투명 데스크톱 앱을 생성합니다. 생성된 실행 파일과 ZIP은 로컬 `downloads/` 폴더에 보관하며, Firebase용 ZIP·체크섬을 `releases/`에 복사합니다. Firebase Hosting은 ZIP을, GitHub Releases는 EXE와 ZIP을 제공합니다. Windows 검증 범위는 위 데스크톱 절을 참고하세요.

검사: `tests/weather.cjs`(휴대폰·4K·울트라와이드·고해상도에서 비/눈/우박의 전체 영역 표시·움직임·리사이즈), `tests/room.cjs`(공개 화면·터치/키보드 메뉴·시간·날씨·행동·모바일 입력), `tests/room-routes.cjs`(전체 타워/발판 이동), `tests/playground.cjs`(기록 페이지 엔진), `tests/offline-playground.cjs`(오프라인), `tests/sizes.cjs`(체중과 크기 전달), `node tests/sync.cjs`(저장 중 재수정). 브라우저 검사는 `PLAYWRIGHT_MODULE`, 필요하면 `BROWSER_EXECUTABLE` 환경 변수를 지정합니다.

풍경 감상은 도달 가능한 가장 높은 캣워커부터 고릅니다. 넓은 상단 다리에는 최대 세 마리가 88px 간격으로 나란히 앉고, 작은 화면은 위쪽 빈 자리부터 나누어 사용합니다. `tests/scenery.cjs`로 높은 자리 선택·나란히 앉기·실제 이동을 검사합니다.

소양(러시안블루)과 소미(치즈 태비 코리안숏헤어)는 박박사님 댁의 방문 친구이며, 팡이(분홍빛 피부와 큰 귀)도 함께 방문합니다. 방을 연 뒤 45~90초에 처음 찾아와 2~3분 놀고, 5~8분 쉬었다 다시 방문합니다. 빈 곳을 탭해 **친구 초대**를 누르면 바로 만날 수 있습니다. 숨긴 탭·고양이 숨김·움직임 쉬기 중에는 방문 시간이 흐르지 않으며, 체중 기록에는 추가되지 않습니다.

고양이 시계 아래의 문페이즈는 현재 기기 날짜에 맞춰 갱신됩니다. [NASA 월상표](https://eclipse.gsfc.nasa.gov/phase/phases1901.html)의 2000-01-06 18:14 UTC 새달과 평균 삭망월 29.530588일을 바탕으로 한 장식용 근사치입니다. 정밀 천문 시각을 계산하는 용도는 아닙니다.

## JavaScript 컴파일과 성능 검사 (3.1)

`records.html`과 `room/`는 읽기 쉬운 원본입니다. `npm run build` 또는 Firebase Hosting의 predeploy에서 `scripts/build-hosting.py`가 인라인 JavaScript를 고정 버전 esbuild로 컴파일·압축한 뒤 `site/`에 배포할 일곱 파일만 만듭니다. `site/`와 `build/`는 생성물이며 Git에 넣지 않습니다. 소스맵·빌드 도구·원본 사진·개발 파일은 Hosting에 포함되지 않습니다.

데스크톱의 renderer는 `playground.js`로 컴파일하고 엄격한 로컬 CSP로 불러옵니다. main/preload도 패키징할 때 컴파일합니다. Electron은 V8 코드 캐시 정책을 사용합니다. esbuild는 JavaScript 변환·압축 도구이며 네이티브 코드로 바꾸는 것은 아닙니다. 실제 실행 비용은 위치·크기 DOM 쓰기 생략, 발판 조회 캐시, 물결의 좁은 이미지 영역 그리기와 Canvas 재사용, 날씨 30fps 및 맑은 날 중복 그리기 제거로 줄였습니다.

`tests/performance.cjs`는 같은 1440×960 화면·고양이 8마리·5회 중앙값으로 정지/걷기 틱을 측정하고, 물결 180프레임 평균도 진단용으로 측정합니다. Canvas의 비동기 GPU 처리 편차가 커서 이 물결 수치는 속도 개선 판단에 사용하지 않습니다. CPU 처리 구간의 마이크로벤치마크이며 전체 앱 FPS나 Windows 성능의 보장은 아닙니다. `BENCH_OUT`으로 결과 JSON을 저장하고 `HORI_SITE_DIR`로 컴파일 배포 폴더를 지정할 수 있습니다. JavaScript 크기는 `build/compile-report.json`에 기록됩니다. 귀 정렬과 귀 밑동 고정축은 `tests/ears.cjs`가 11마리·6가지 자세에서 검사합니다. `tests/expressions.cjs`는 눈을 뜨고 감을 때 눈 중심이 이동하지 않는지, 눈꺼풀과 눈 키스 타이밍이 맞는지 검사합니다.

2026-10-23 macOS/Brave headless에서 v3.0.0 원본과 3.1 컴파일 배포본을 같은 조건으로 비교했습니다. 정지 틱은 약 0.00533→0.00100ms, 걷기 틱은 약 0.00656→0.00444ms였습니다. 프레임당 위치·크기 transform 쓰기는 정지 16→0회, 걷기 16→8회로 줄었습니다. 이 구간의 CPU 비용 감소이며 전체 앱 FPS 향상률로 해석하지 않습니다.
