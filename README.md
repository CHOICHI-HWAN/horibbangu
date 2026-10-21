# 🐾 호리빵구 체중기록

반려동물(호야, 보리, 건빵, 살구, 로이, 삼식, 삼순)의 체중을 기록하고 추이를 보는 웹 앱입니다.
배포 주소: https://horibbangu.web.app

## 기능

- **빠른 입력**: `호야, 4.40` 처럼 입력하면 오늘 날짜로 저장 (`호야 4.4, 보리 6.0`, `2026.10.20 호야 4.4`, `보리 5.76?` 도 가능)
- **아이별 보기**: 카드를 누르면 그 아이의 그래프·기록만 표시, 오늘 체중을 바로 입력
- **평균·이상치**: 아이별 평균선과 평균에서 많이 벗어난 값을 표시
- **기록 관리**: 추가/수정/삭제, 아이 추가·이름·색 변경, CSV·JSON 내보내기, JSON 가져오기
- **고양이 친구들**: 아이마다 한 마리씩 화면 아래에서 자고, 마우스를 움직이면 귀를 쫑긋하고, 가끔 커서를 사냥하거나 식빵을 굽고 골골송을 부르고 술래잡기를 함 (누르면 그 아이 기록으로 이동, 🐱 버튼으로 끄기). 그루밍, 쿠션 꾹꾹이, 캣타워 점프도 함
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
