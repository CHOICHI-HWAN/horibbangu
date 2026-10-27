# 외부 소프트웨어·자료 고지

확인 기준: 앱 3.5.2 / 2026-10-27. 이 문서는 구성요소를 구분하는 안내이며,
배포본에 포함된 원문 라이선스와 각 권리자의 조건을 대신하지 않습니다.
호리빵구의 제한적 이용 정책은 아래 외부 구성요소의 이용 권리를 축소하지 않습니다.

| 구성요소 | 사용 위치 | 라이선스·고지 |
|---|---|---|
| Zig 0.15.2·LLVM libc++/libc++abi·MinGW-w64 런타임 | 네이티브 빌드·일부 정적 실행 보조 코드 | MIT·Apache-2.0 WITH LLVM-exception·ZPL 등. 배포 도구의 원문을 `NativeRuntime-LICENSES.txt`에 보관·내장합니다. |
| Microsoft.Web.WebView2 1.0.4258.31 | 경량 Windows 앱의 WebView2Loader.dll 및 SDK | Microsoft의 BSD형 라이선스. `WebView2-LICENSE.txt`, `WebView2-NOTICE.txt` 원문을 함께 포함합니다. |
| Microsoft Edge WebView2 Runtime | PC에 별도로 설치된 공유 실행 환경 | Microsoft의 런타임 조건을 따릅니다. 경량 EXE에는 브라우저 엔진을 포함하지 않습니다. |
| Electron 45.0.0 | 기존 Windows 호환판 실행 환경 | MIT. 공식 런타임의 `LICENSE` 원문을 유지합니다. |
| Chromium·Node.js 및 런타임 내 구성요소 | Electron 런타임 | 구성요소별 조건. 공식 런타임의 `LICENSES.chromium.html` 및 해당 고지를 유지합니다. |
| Firebase JavaScript SDK 10.12.2 | 체중 기록 웹페이지의 인증·동기화 | Apache-2.0. CDN에서 불러오며 공개 고양이 방·Windows 앱에는 포함하지 않습니다. |
| esbuild 0.28.2 | 개발·컴파일 도구 | MIT. 최종 앱에서 실행되는 런타임 라이브러리가 아닙니다. |
| electron-builder 26.15.3 | 개발·Windows 포터블 패키징 도구 | MIT. 도구 전체가 앱 런타임으로 들어가는 것은 아닙니다. |
| NSIS toolset 1.2.1 / NSIS 3.12 | 단일 EXE의 실행·압축 해제 부분 | zlib/libpng, 압축 모듈 등은 별도 조건. 공식 NSIS 라이선스 원문을 확인합니다. |
| System NSIS 플러그인 | 포터블 실행기 | NSIS의 해당 라이선스를 따릅니다. |
| StdUtils 1.14 플러그인 | 포터블 실행기의 인수 처리 | LGPL-2.1-or-later 및 저자의 NSIS 플러그인 인터페이스 관련 설명. |
| Nsis7z / 7-Zip 19.00 기반 플러그인 | 포터블 실행기의 압축 해제 | 7-Zip/LGPL 및 해당 소스 파일의 조건. |
| elevate.exe 1.3.0 | 도구 묶음에서 실행 폴더에 함께 복사되는 보조 파일 | 해당 원작자·배포본의 조건. 앱의 개인 이용 정책으로 대체하지 않습니다. |
| 7-Zip 빌드 도구 | 빌드 중 압축·검증 | 도구 자체의 LGPL·기타 구성요소별 조건. 앱 코드에 대한 권리 양도가 아닙니다. |

원문을 확인한 Electron·esbuild·electron-builder·NSIS·StdUtils·LGPL 고지는
[legal/third-party](legal/third-party/)에도 보관했습니다. 런타임의 `LICENSES.chromium.html`은
기존 Electron 호환판 실행 폴더에서 원본 그대로 유지됩니다.

## 확인한 원문과 배포 자료

- WebView2 SDK: https://www.nuget.org/packages/Microsoft.Web.WebView2/1.0.4258.31
- WebView2 런타임 배포: https://learn.microsoft.com/microsoft-edge/webview2/concepts/distribution
- Electron: https://github.com/electron/electron/blob/v45.0.0/LICENSE
- Firebase SDK: https://github.com/firebase/firebase-js-sdk/blob/firebase%4010.12.2/LICENSE
- esbuild: https://github.com/evanw/esbuild/blob/v0.28.2/LICENSE.md
- electron-builder: https://github.com/electron-userland/electron-builder/blob/master/LICENSE
- NSIS: https://nsis.sourceforge.io/Docs/AppendixI.html
- 고정 NSIS 도구 묶음의 빌드 명세: https://github.com/electron-userland/electron-builder-binaries/tree/nsis%401.2.1/packages/nsis
- StdUtils 원본: https://github.com/lordmulder/stdutils/releases/tag/1.14
- StdUtils 라이선스 설명: https://nsis.sourceforge.io/StdUtils_plug-in
- Nsis7z 원본과 소스 안내: https://nsis.sourceforge.io/Nsis7z_plug-in
- elevate 원본 안내: https://code.kliu.org/misc/elevate/
- 7-Zip 라이선스: https://www.7-zip.org/license.txt

LGPL 등에서 허용하는 외부 라이브러리의 수정·재배포·분석 권리와 필요한 소스 제공은
그 라이선스를 따릅니다. 호리빵구의 재사용 금지 문구로 이를 제한하지 않습니다.
단일 EXE에 묶였다는 이유로 외부 라이브러리의 고지·소스 의무가 없어지지 않습니다.

## 그림·사진·이름

고양이 사진은 캐릭터 제작의 참고 자료입니다. 사진 제공자가 가진 권리는 유지되며,
참고 사진 원본을 일반 이용자에게 재사용하도록 허락한 것으로 해석하지 않습니다.
공공영역에 속하는 명화 원작의 권리를 호리빵구 제작자가 독점한다고 표시하지 않습니다.
AI 보조·생성 그림 및 편집 결과의 보호 범위는 실제 창작 기여와 적용 법령에 따릅니다.
화풍이나 일반적인 고양이 모습·행동 자체에 대한 독점권을 주장하지 않습니다.

이 목록은 확인한 주요 구성요소 안내이며, 전이 의존성을 모두 포함한 법률 적합성 감사 보고서는 아닙니다.
실제 배포 때는 사용한 플러그인·런타임의 전체 고지와 소스 제공 조건을 함께 확인해야 합니다.

각 프로젝트·서비스·제품의 이름과 상표는 해당 권리자에게 속합니다.
외부 업체나 원작자와의 제휴·공식 승인·운영 관계를 표시하는 문서가 아닙니다.
