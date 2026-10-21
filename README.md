# 🐾 호리빵구 체중기록

반려동물(호야, 보리, 건빵, 살구, 로이, 삼식, 삼순)의 체중을 기록하고 추이를 보는 웹 앱입니다.
배포 주소: https://horibbangu.web.app

## 기능

- **빠른 입력**: `호야, 4.40` 처럼 입력하면 오늘 날짜로 저장 (`호야 4.4, 보리 6.0`, `2026.10.20 호야 4.4`, `보리 5.76?` 도 가능)
- **아이별 보기**: 카드를 누르면 그 아이의 그래프·기록만 표시, 오늘 체중을 바로 입력
- **평균·이상치**: 아이별 평균선과 평균에서 많이 벗어난 값을 표시
- **기록 관리**: 추가/수정/삭제, 아이 추가·이름·색 변경, CSV·JSON 내보내기, JSON 가져오기
- **고양이 친구들**: 아이마다 한 마리씩 화면 아래에서 자고, 마우스를 움직이면 귀를 쫑긋하고, 가끔 커서를 사냥하거나 식빵을 굽고 골골송을 부르고 술래잡기를 함 (누르면 그 아이 기록으로 이동, 🐱 버튼으로 끄기). 그루밍, 쿠션 꾹꾹이, 캣타워 점프·기둥 스크래칭·캣휠 달리기도 함. 양쪽 캣타워와 해먹·판자·로프 다리, 경사로를 오르내리며 곳곳을 우다다 뛰어다님
- **아이들의 취향**: 보리는 봉지·박스·소파, 살구는 바구니·뒤집기, 호야는 턱을 괴고 잠자기. 로이도 사진의 장모와 흰 가슴털을 반영. 곳곳의 가구와 호야의 투명해먹으로 찾아가 쉬고, 로이와 동글이는 가끔 날개로 날아다님. 동글이는 체중기록 없이 화면에서 함께하는 친구로 등장
- **동기화**: Google 로그인 + Firestore로 여러 기기에서 실시간 공유

## 구조

| 파일 | 설명 |
|---|---|
| `index.html` | 앱 전체 (HTML/CSS/JS, 빌드 없음) |
| `config.js` | Firebase 웹 설정값 (비워두면 이 기기에만 저장) |
| `firestore.rules` | 허용한 이메일만 읽기/쓰기 |
| `CHANGELOG.md` | 버전별 변경 내역 |
| `firebase.json` | Firebase Hosting / Firestore 설정 |

## 개발·배포

빌드 과정이 없어 `index.html`을 브라우저로 열면 바로 동작합니다.

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

1. `index.html`의 `VERSION`과 `CHANGELOG.md`를 수정
2. 커밋 후 태그 생성: `git tag -a v1.1.0 -m "v1.1.0"`
3. `git push && git push --tags`
4. `firebase deploy --only hosting`

앱 화면 맨 아래에 현재 버전이 표시됩니다.

## 놀이터 동작 검사

Playwright가 설치된 개발 환경에서 `node tests/playground.cjs`를 실행합니다.
`PLAYWRIGHT_MODULE`로 모듈 경로, `BROWSER_EXECUTABLE`로 설치된 Chromium 계열 브라우저 경로를 지정할 수도 있습니다.
검사는 별도 브라우저 세션에서 실행하며 Firebase 연결을 차단하고 실제 체중기록을 저장하지 않습니다.

## Windows 고양이 놀이터

`downloads/호리빵구.exe`는 체중기록 기능이 없는 오프라인 고양이 놀이터입니다.
Windows 바탕화면에 저장하고 더블클릭하면 됩니다. Edge/Chrome/Brave가 있으면 별도 창으로 열립니다.
고양이와 가구·투명해먹·날개 비행만 포함하며 Firebase와 체중 데이터는 포함하지 않습니다.
Windows x64 GUI 파일이며, 서명되지 않은 개인용 빌드입니다. Windows 실기기 실행은 아직 미확인입니다.

재빌드: Zig 0.15.2와 Python 3가 있는 환경에서 `desktop/windows/build.sh`를 실행합니다.
`ZIG_BIN`으로 Zig 실행 경로를 지정할 수 있습니다. `python3 desktop/windows/test_binary.py`로
GUI 형식·리소스·아이콘·내장 HTML 일치·시스템 DLL 의존성을 검사합니다.
웹 코드를 바꾼 뒤에는 실행 파일도 다시 빌드해야 합니다.
