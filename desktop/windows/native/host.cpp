#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <windowsx.h>
#include <shellapi.h>
#include <shlobj.h>
#include <dwmapi.h>
#include <dcomp.h>
#include <stdio.h>
#include <stdlib.h>
#include "WebView2.h"
#include "webview-guids.h"
#include "edition.h"

static HWND windowHandle,controlWindow,wallpaperParent,wallpaperAfter;
static UINT32 browserProcess=0;
static ICoreWebView2Environment* environment;
static ICoreWebView2Controller* controller;
static ICoreWebView2CompositionController* composition;
static ICoreWebView2* webview;
static IDCompositionDevice* device;
static IDCompositionTarget* target;
static IDCompositionVisual* visual;
static IDCompositionEffectGroup* opacityEffect;
static bool background=false,ready=false;
static wchar_t assetFolder[2048],profileFolder[2048];
static const wchar_t* origin=L"https://horibbangu.local/";
static const wchar_t* pageUrl=L"https://horibbangu.local/playground.html";
static UINT taskbarCreated;
static const UINT trayMessage=WM_APP+1,secondInstance=WM_APP+2;
static const wchar_t* windowClass=APP_WINDOW_CLASS;

// The shell keeps icons above this visual and normal applications above the shell.
// Windows 11's raised desktop uses siblings under Progman; older shells use WorkerW.
static BOOL CALLBACK findWallpaper(HWND top,LPARAM){
 HWND icons=FindWindowExW(top,nullptr,L"SHELLDLL_DefView",nullptr);
 if(!icons)return TRUE;
 HWND child=FindWindowExW(top,nullptr,L"WorkerW",nullptr);
 if(child){wallpaperParent=top;wallpaperAfter=icons;}
 else{wallpaperParent=FindWindowExW(nullptr,top,L"WorkerW",nullptr);wallpaperAfter=HWND_TOP;}
 return wallpaperParent?FALSE:TRUE;
}
static bool attachWallpaper(){
 HWND progman=FindWindowW(L"Progman",nullptr);if(!progman)return false;
 DWORD_PTR result=0;
 SendMessageTimeoutW(progman,0x052c,0xd,1,SMTO_ABORTIFHUNG,1000,&result);
 wallpaperParent=nullptr;wallpaperAfter=HWND_TOP;EnumWindows(findWallpaper,0);
 if(!wallpaperParent)return false;
 LONG_PTR style=GetWindowLongPtrW(windowHandle,GWL_STYLE);
 SetWindowLongPtrW(windowHandle,GWL_STYLE,(style&~WS_POPUP)|WS_CHILD);
 SetLastError(0);SetParent(windowHandle,wallpaperParent);
 return GetParent(windowHandle)==wallpaperParent;
}

// A composition WebView can own native popup input windows outside its host.
// Disable only this edition's browser process; keep rendering and tray UI alive.
static BOOL CALLBACK disableBrowserInput(HWND h,LPARAM){
 DWORD pid=0;GetWindowThreadProcessId(h,&pid);
 if(pid==browserProcess&&IsWindowEnabled(h))EnableWindow(h,FALSE);
 return TRUE;
}
static void muteBrowserInput(){
 if(!browserProcess)return;
 EnumWindows(disableBrowserInput,0);
 EnumChildWindows(wallpaperParent?wallpaperParent:windowHandle,disableBrowserInput,0);
}

#include "settings.h"

static bool diagnostics=false;
static void trace(const wchar_t* text){
 if(!diagnostics)return;wchar_t path[2048];swprintf(path,2048,L"%ls\\native-diagnostics.txt",assetFolder);
 HANDLE file=CreateFileW(path,FILE_APPEND_DATA,FILE_SHARE_READ|FILE_SHARE_WRITE,nullptr,OPEN_ALWAYS,FILE_ATTRIBUTE_NORMAL,nullptr);
 if(file!=INVALID_HANDLE_VALUE){char utf8[4096];int n=WideCharToMultiByte(CP_UTF8,0,text,-1,utf8,sizeof(utf8),nullptr,nullptr);DWORD written;if(n>0)WriteFile(file,utf8,n-1,&written,nullptr);WriteFile(file,"\r\n",2,&written,nullptr);CloseHandle(file);}
}
static void error(const wchar_t* message,HRESULT hr=E_FAIL){
 wchar_t text[2048];swprintf(text,2048,L"%ls\n\n오류 코드: 0x%08lX",message,(unsigned long)hr);
 MessageBoxW(windowHandle,text,APP_TITLE,MB_OK|MB_ICONERROR);
 if(windowHandle)DestroyWindow(windowHandle);
}
static void command(const wchar_t* text){if(webview)webview->PostWebMessageAsString(text);}
static void menu();
static void trayAction(UINT choice);
static void showControls(){openSettings();}
static void tray(bool remove=false){
 NOTIFYICONDATAW data={};data.cbSize=sizeof(data);data.hWnd=controlWindow;data.uID=1;
 data.uFlags=NIF_MESSAGE|NIF_ICON|NIF_TIP;data.uCallbackMessage=trayMessage;
 data.hIcon=(HICON)LoadImageW(GetModuleHandleW(nullptr),MAKEINTRESOURCEW(1),IMAGE_ICON,32,32,LR_SHARED);
 lstrcpynW(data.szTip,APP_TITLE L" · 클릭: 메뉴 / 오른쪽 클릭: 배경·종료",128);
 Shell_NotifyIconW(remove?NIM_DELETE:NIM_ADD,&data);
 if(!remove){data.uVersion=NOTIFYICON_VERSION_4;Shell_NotifyIconW(NIM_SETVERSION,&data);}
}
static void menu(){
 HMENU m=CreatePopupMenu();
 AppendMenuW(m,MF_STRING|(background?MF_CHECKED:0),101,L"호수 배경 보이기");
 AppendMenuW(m,MF_STRING|(!IsWindowVisible(windowHandle)?MF_CHECKED:0),102,L"잠깐 숨기기");
 AppendMenuW(m,MF_STRING,110,L"화면·투명도 설정…");
 AppendMenuW(m,MF_SEPARATOR,0,nullptr);
#if APP_HAS_GUESTS
 AppendMenuW(m,MF_STRING,104,L"친구 초대");
 AppendMenuW(m,MF_STRING,113,L"날개 친구들");
#endif
 AppendMenuW(m,MF_STRING,105,L"움직임 켜기 / 쉬기");
 AppendMenuW(m,MF_STRING,111,L"쉬는 시간");AppendMenuW(m,MF_STRING,112,L"풍경 감상");
 HMENU weather=CreatePopupMenu();
 const wchar_t* weatherNames[]={L"자동",L"맑음",L"비",L"눈",L"우박"};
 for(int i=0;i<5;i++)AppendMenuW(weather,MF_STRING,120+i,weatherNames[i]);
 AppendMenuW(m,MF_POPUP,(UINT_PTR)weather,L"창밖 날씨");
 AppendMenuW(m,MF_SEPARATOR,0,nullptr);AppendMenuW(m,MF_STRING,199,L"종료 (Ctrl+Alt+Q)");
 POINT p;GetCursorPos(&p);SetForegroundWindow(controlWindow);
 UINT choice=TrackPopupMenu(m,TPM_RETURNCMD|TPM_NONOTIFY|TPM_RIGHTBUTTON,p.x,p.y,0,controlWindow,nullptr);DestroyMenu(m);
 trayAction(choice);PostMessageW(windowHandle,WM_NULL,0,0);
}
static void trayAction(UINT choice){
 if(choice==101){background=!background;command(background?L"background-on":L"background-off");}
 if(choice==102)ShowWindow(windowHandle,IsWindowVisible(windowHandle)?SW_HIDE:SW_SHOWNOACTIVATE);
 if(choice==110)openSettings();
 if(choice==111)command(L"rest");if(choice==112)command(L"view");if(choice==113)command(L"wings");
 const wchar_t* weatherCommands[]={L"weather-auto",L"weather-clear",L"weather-rain",L"weather-snow",L"weather-hail"};
 if(choice>=120&&choice<=124)command(weatherCommands[choice-120]);
 if(choice==104)command(L"friends");if(choice==105)command(L"motion");if(choice==199)DestroyWindow(windowHandle);
}
static LRESULT CALLBACK procedure(HWND h,UINT message,WPARAM w,LPARAM l){
 if(taskbarCreated&&message==taskbarCreated){tray();return 0;}
 if(message==secondInstance){showControls();return 0;}
 switch(message){
 case WM_APP+3:return 0; // Ignore legacy queued mouse forwarding.
 case WM_COMMAND:trayAction(LOWORD(w));return 0;
 case WM_MOUSEACTIVATE:return MA_NOACTIVATE;
 case WM_NCHITTEST:return HTTRANSPARENT;
 case WM_WINDOWPOSCHANGING:{auto p=(WINDOWPOS*)l;if(!(p->flags&SWP_NOZORDER)){p->hwndInsertAfter=wallpaperParent?wallpaperAfter:HWND_BOTTOM;p->flags|=SWP_NOACTIVATE;}}break;
 case WM_ERASEBKGND:return 1;
 case WM_PAINT:{PAINTSTRUCT ps;BeginPaint(h,&ps);EndPaint(h,&ps);return 0;}
 case WM_DISPLAYCHANGE:case WM_SETTINGCHANGE:bounds();if(settingsWindow)fillMonitors();return 0;
 case WM_DPICHANGED:bounds();return 0;
 case WM_MOUSEMOVE:case WM_LBUTTONDOWN:case WM_LBUTTONUP:case WM_LBUTTONDBLCLK:
 case WM_RBUTTONDOWN:case WM_RBUTTONUP:case WM_MBUTTONDOWN:case WM_MBUTTONUP:case WM_MOUSEWHEEL:case WM_MOUSEHWHEEL:return 0; // The visual never receives or forwards user input.
 case WM_TIMER:
  muteBrowserInput();
  if(IsWindowVisible(h))SetWindowPos(h,wallpaperParent?wallpaperAfter:HWND_BOTTOM,0,0,0,0,SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE);
  return 0;
 case WM_HOTKEY:if(w==1)showControls();else DestroyWindow(h);return 0;
 case WM_APP+1:
  if(LOWORD(l)==NIN_SELECT||LOWORD(l)==WM_LBUTTONUP)menu();
  if(LOWORD(l)==WM_CONTEXTMENU||LOWORD(l)==WM_RBUTTONUP)menu();return 0;
 case WM_CLOSE:DestroyWindow(h);return 0;
 case WM_DESTROY:
  ready=false;if(settingsWindow)DestroyWindow(settingsWindow);KillTimer(h,1);tray(true);UnregisterHotKey(controlWindow,1);UnregisterHotKey(controlWindow,2);
  if(controller)controller->Close();PostQuitMessage(0);return 0;
 }return DefWindowProcW(h,message,w,l);
}
// A separate top-level message window owns the tray/hotkeys while the visual is
// a child of Explorer. It never covers the desktop or accepts desktop clicks.
static LRESULT CALLBACK controlProcedure(HWND h,UINT m,WPARAM w,LPARAM l){
 if((taskbarCreated&&m==taskbarCreated)||m==trayMessage||m==secondInstance||m==WM_HOTKEY||m==WM_COMMAND)
  return procedure(windowHandle,m,w,l);
 return DefWindowProcW(h,m,w,l);
}

#define CALLBACK_BASE(I) \
 ULONG refs=1; \
 HRESULT STDMETHODCALLTYPE QueryInterface(REFIID id,void** result) override {if(!result)return E_POINTER;*result=nullptr;if(IsEqualIID(id,IID_IUnknown)||IsEqualIID(id,MY_##I)){*result=static_cast<I*>(this);AddRef();return S_OK;}return E_NOINTERFACE;} \
 ULONG STDMETHODCALLTYPE AddRef() override{return ++refs;} \
 ULONG STDMETHODCALLTYPE Release() override{ULONG n=--refs;if(!n)delete this;return n;}

struct MessageHandler:ICoreWebView2WebMessageReceivedEventHandler{
 CALLBACK_BASE(ICoreWebView2WebMessageReceivedEventHandler)
 HRESULT STDMETHODCALLTYPE Invoke(ICoreWebView2*,ICoreWebView2WebMessageReceivedEventArgs* args) override{
  LPWSTR source=nullptr,message=nullptr;args->get_Source(&source);trace(source?source:L"message source null");
  if(!source||wcscmp(source,pageUrl)){CoTaskMemFree(source);return S_OK;}CoTaskMemFree(source);
  if(SUCCEEDED(args->TryGetWebMessageAsString(&message))&&message){trace(message);
   if(!wcscmp(message,L"background:1"))background=true;if(!wcscmp(message,L"background:0"))background=false;
   if(!wcscmp(message,L"quit"))PostMessageW(windowHandle,WM_CLOSE,0,0);
  }CoTaskMemFree(message);return S_OK;
 }
};
struct NavigationHandler:ICoreWebView2NavigationStartingEventHandler{
 CALLBACK_BASE(ICoreWebView2NavigationStartingEventHandler)
 HRESULT STDMETHODCALLTYPE Invoke(ICoreWebView2*,ICoreWebView2NavigationStartingEventArgs* args) override{
  LPWSTR uri=nullptr;args->get_Uri(&uri);size_t n=wcslen(pageUrl);
  if(!uri||wcsncmp(uri,pageUrl,n)||(uri[n]&&uri[n]!=L'#'))args->put_Cancel(TRUE);
  CoTaskMemFree(uri);return S_OK;
 }
};
struct NewWindowHandler:ICoreWebView2NewWindowRequestedEventHandler{
 CALLBACK_BASE(ICoreWebView2NewWindowRequestedEventHandler)
 HRESULT STDMETHODCALLTYPE Invoke(ICoreWebView2*,ICoreWebView2NewWindowRequestedEventArgs* args) override{args->put_Handled(TRUE);return S_OK;}
};
struct PermissionHandler:ICoreWebView2PermissionRequestedEventHandler{
 CALLBACK_BASE(ICoreWebView2PermissionRequestedEventHandler)
 HRESULT STDMETHODCALLTYPE Invoke(ICoreWebView2*,ICoreWebView2PermissionRequestedEventArgs* args) override{args->put_State(COREWEBVIEW2_PERMISSION_STATE_DENY);return S_OK;}
};
struct ResourceHandler:ICoreWebView2WebResourceRequestedEventHandler{
 CALLBACK_BASE(ICoreWebView2WebResourceRequestedEventHandler)
 HRESULT STDMETHODCALLTYPE Invoke(ICoreWebView2*,ICoreWebView2WebResourceRequestedEventArgs* args) override{
  ICoreWebView2WebResourceRequest* request=nullptr;LPWSTR uri=nullptr;args->get_Request(&request);if(request)request->get_Uri(&uri);
  if(!uri||wcsncmp(uri,origin,wcslen(origin))){ICoreWebView2WebResourceResponse* response=nullptr;
   if(SUCCEEDED(environment->CreateWebResourceResponse(nullptr,403,L"Blocked",L"Content-Type: text/plain",&response))){args->put_Response(response);response->Release();}}
  CoTaskMemFree(uri);if(request)request->Release();return S_OK;
 }
};
struct ReadyHandler:ICoreWebView2NavigationCompletedEventHandler{
 CALLBACK_BASE(ICoreWebView2NavigationCompletedEventHandler)
 HRESULT STDMETHODCALLTYPE Invoke(ICoreWebView2*,ICoreWebView2NavigationCompletedEventArgs* args) override{
  BOOL success=FALSE;args->get_IsSuccess(&success);if(!success){error(L"고양이 화면을 불러오지 못했습니다.");return S_OK;}
  if(!wallpaperParent&&!attachWallpaper()){error(L"Windows 바탕화면 배경 계층에 연결하지 못했습니다. Explorer가 실행 중인지 확인해 주세요.");return S_OK;}
  bounds();ready=true;
  muteBrowserInput();EnableWindow(windowHandle,FALSE); // Disabled children pass all mouse input to Explorer.
  ShowWindow(windowHandle,SW_SHOWNOACTIVATE);SetTimer(windowHandle,1,1000,nullptr);return S_OK;
 }
};
static const wchar_t* bridge=LR"JS((()=>{
 const allowed=['friends','motion','rest','view','wings','background-on','background-off','weather-auto','weather-clear','weather-rain','weather-snow','weather-hail'];
 const send=s=>chrome.webview.postMessage(s);
 window.desktopHost=Object.freeze({
  passive:true,
  setInteractive:()=>{}, // No route can re-enable window input.
  setBackground:v=>{if(typeof v==='boolean')send('background:'+(v?'1':'0'));},
  quit:()=>send('quit'),
  onCommand:cb=>{if(typeof cb==='function')chrome.webview.addEventListener('message',e=>{if(allowed.includes(e.data))cb(e.data);});}
 });
})();)JS";
struct ScriptReadyHandler:ICoreWebView2AddScriptToExecuteOnDocumentCreatedCompletedHandler{
 CALLBACK_BASE(ICoreWebView2AddScriptToExecuteOnDocumentCreatedCompletedHandler)
 HRESULT STDMETHODCALLTYPE Invoke(HRESULT result,LPCWSTR) override{
  if(FAILED(result)){error(L"앱 연결을 준비하지 못했습니다.",result);return S_OK;}
  muteBrowserInput();bounds();controller->put_IsVisible(TRUE);webview->Navigate(pageUrl);return S_OK;
 }
};
struct CompositionHandler:ICoreWebView2CreateCoreWebView2CompositionControllerCompletedHandler{
 CALLBACK_BASE(ICoreWebView2CreateCoreWebView2CompositionControllerCompletedHandler)
 HRESULT STDMETHODCALLTYPE Invoke(HRESULT result,ICoreWebView2CompositionController* created) override{
  if(FAILED(result)||!created){error(L"투명 고양이 창을 만들지 못했습니다.",result);return S_OK;}
  composition=created;composition->AddRef();HRESULT hr=composition->QueryInterface(MY_ICoreWebView2Controller,(void**)&controller);
  if(FAILED(hr)){error(L"WebView2 컨트롤러를 만들지 못했습니다.",hr);return S_OK;}
  controller->get_CoreWebView2(&webview);webview->get_BrowserProcessId(&browserProcess);ICoreWebView2Controller2* color=nullptr;
  if(SUCCEEDED(controller->QueryInterface(MY_ICoreWebView2Controller2,(void**)&color))){color->put_DefaultBackgroundColor({0,0,0,0});color->Release();}
  hr=DCompositionCreateDevice(nullptr,MY_IDCompositionDevice,(void**)&device);
  if(SUCCEEDED(hr))hr=device->CreateTargetForHwnd(windowHandle,TRUE,&target);
  if(SUCCEEDED(hr))hr=device->CreateVisual(&visual);
  if(SUCCEEDED(hr))hr=device->CreateEffectGroup(&opacityEffect);
  if(SUCCEEDED(hr))hr=opacityEffect->SetOpacity((100-transparency)/100.0f);
  if(SUCCEEDED(hr))hr=visual->SetEffect(opacityEffect);
  if(SUCCEEDED(hr))hr=target->SetRoot(visual);
  if(SUCCEEDED(hr))hr=composition->put_RootVisualTarget(visual);
  if(SUCCEEDED(hr))hr=device->Commit();
  if(FAILED(hr)){error(L"투명 화면 합성을 시작하지 못했습니다.",hr);return S_OK;}
  ICoreWebView2_3* mapped=nullptr;
  if(FAILED(webview->QueryInterface(MY_ICoreWebView2_3,(void**)&mapped))){error(L"WebView2 런타임 업데이트가 필요합니다.");return S_OK;}
  mapped->SetVirtualHostNameToFolderMapping(L"horibbangu.local",assetFolder,COREWEBVIEW2_HOST_RESOURCE_ACCESS_KIND_DENY_CORS);mapped->Release();
  ICoreWebView2Settings* settings=nullptr;webview->get_Settings(&settings);
  if(settings){settings->put_AreDevToolsEnabled(FALSE);settings->put_AreDefaultContextMenusEnabled(FALSE);settings->put_IsStatusBarEnabled(FALSE);settings->put_AreHostObjectsAllowed(FALSE);settings->Release();}
  EventRegistrationToken token;
  auto a=new MessageHandler;HRESULT messageResult=webview->add_WebMessageReceived(a,&token);a->Release();wchar_t messageLog[96];swprintf(messageLog,96,L"register message: %08lX",(unsigned long)messageResult);trace(messageLog);
  auto b=new NavigationHandler;webview->add_NavigationStarting(b,&token);b->Release();
  auto c=new NewWindowHandler;webview->add_NewWindowRequested(c,&token);c->Release();
  auto d=new PermissionHandler;webview->add_PermissionRequested(d,&token);d->Release();
  auto e=new ResourceHandler;webview->AddWebResourceRequestedFilter(L"http*",COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL);webview->add_WebResourceRequested(e,&token);e->Release();
  auto f=new ReadyHandler;webview->add_NavigationCompleted(f,&token);f->Release();
  auto scriptReady=new ScriptReadyHandler;hr=webview->AddScriptToExecuteOnDocumentCreated(bridge,scriptReady);scriptReady->Release();if(FAILED(hr))error(L"앱 연결을 등록하지 못했습니다.",hr);return S_OK;
 }
};
struct EnvironmentHandler:ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler{
 CALLBACK_BASE(ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler)
 HRESULT STDMETHODCALLTYPE Invoke(HRESULT result,ICoreWebView2Environment* created) override{
  if(FAILED(result)||!created){error(L"WebView2를 시작하지 못했습니다.",result);return S_OK;}
  environment=created;environment->AddRef();ICoreWebView2Environment3* comp=nullptr;
  HRESULT hr=environment->QueryInterface(MY_ICoreWebView2Environment3,(void**)&comp);
  if(FAILED(hr)){error(L"WebView2 런타임 업데이트가 필요합니다.",hr);return S_OK;}
  auto callback=new CompositionHandler;hr=comp->CreateCoreWebView2CompositionController(windowHandle,callback);callback->Release();comp->Release();
  if(FAILED(hr))error(L"투명 창을 초기화하지 못했습니다.",hr);return S_OK;
 }
};
static bool resource(int id,const wchar_t* name){
 wchar_t path[2048];swprintf(path,2048,L"%ls\\%ls",assetFolder,name);
 HRSRC found=FindResourceW(nullptr,MAKEINTRESOURCEW(id),RT_RCDATA);if(!found)return false;
 DWORD count=SizeofResource(nullptr,found);const void* bytes=LockResource(LoadResource(nullptr,found));
 HANDLE file=CreateFileW(path,GENERIC_WRITE,0,nullptr,CREATE_ALWAYS,FILE_ATTRIBUTE_NORMAL,nullptr);if(file==INVALID_HANDLE_VALUE)return false;
 DWORD written=0;BOOL ok=WriteFile(file,bytes,count,&written,nullptr);CloseHandle(file);return ok&&written==count;
}
int WINAPI wWinMain(HINSTANCE instance,HINSTANCE,PWSTR,int){
 SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
 HANDLE mutex=CreateMutexW(nullptr,FALSE,APP_MUTEX);
 if(GetLastError()==ERROR_ALREADY_EXISTS){
  HWND old=FindWindowW(windowClass,nullptr);
  if(old&&GetPropW(old,L"HoribbanguPassive"))PostMessageW(old,secondInstance,0,0);
  else MessageBoxW(nullptr,L"이전 버전이 아직 실행 중입니다. 시계 옆 트레이에서 이전 앱을 종료한 뒤 새 버전을 실행해 주세요.",APP_TITLE,MB_OK|MB_ICONINFORMATION);
  CloseHandle(mutex);return 0;
 }
 if(FAILED(CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED))){CloseHandle(mutex);return 1;}
 PWSTR local=nullptr;if(FAILED(SHGetKnownFolderPath(FOLDERID_LocalAppData,0,nullptr,&local))){CoUninitialize();CloseHandle(mutex);return 1;}
 swprintf(settingsFile,2048,L"%ls\\%ls\\settings.ini",local,APP_DATA_DIR);
 swprintf(assetFolder,2048,L"%ls\\%ls\\Native\\%ls",local,APP_DATA_DIR,APP_VERSION);swprintf(profileFolder,2048,L"%ls\\%ls\\WebView2",local,APP_DATA_DIR);CoTaskMemFree(local);
 SHCreateDirectoryExW(nullptr,assetFolder,nullptr);SHCreateDirectoryExW(nullptr,profileFolder,nullptr);loadSettings();
 wchar_t diagnosticFlag[4]={};diagnostics=GetEnvironmentVariableW(L"HORIBBANGU_NATIVE_DIAGNOSTICS",diagnosticFlag,4)>0&&diagnosticFlag[0]==L'1';
 const wchar_t* names[]={L"playground.html",L"playground.js",L"WebView2Loader.dll",L"사용방법.txt",L"LICENSE",L"THIRD_PARTY_NOTICES.md",L"WebView2-LICENSE.txt",L"WebView2-NOTICE.txt",L"NativeRuntime-LICENSES.txt"};
 for(int i=0;i<9;i++)if(!resource(101+i,names[i])){error(L"앱 파일을 사용자 폴더에 준비하지 못했습니다.");CoUninitialize();CloseHandle(mutex);return 1;}
 wchar_t loaderPath[2048];swprintf(loaderPath,2048,L"%ls\\WebView2Loader.dll",assetFolder);
 HMODULE loader=LoadLibraryExW(loaderPath,nullptr,LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR|LOAD_LIBRARY_SEARCH_SYSTEM32);
 typedef HRESULT(STDAPICALLTYPE* VersionFn)(PCWSTR,LPWSTR*);
 typedef HRESULT(STDAPICALLTYPE* CreateFn)(PCWSTR,PCWSTR,ICoreWebView2EnvironmentOptions*,ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler*);
 auto version=loader?(VersionFn)GetProcAddress(loader,"GetAvailableCoreWebView2BrowserVersionString"):nullptr;
 auto create=loader?(CreateFn)GetProcAddress(loader,"CreateCoreWebView2EnvironmentWithOptions"):nullptr;
 LPWSTR installed=nullptr;HRESULT hr=version?version(nullptr,&installed):E_FAIL;CoTaskMemFree(installed);
 if(FAILED(hr)||!create){
  const wchar_t* prompt=L"이 작은 실행파일은 Microsoft Edge WebView2 런타임을 사용합니다.\n\n런타임을 찾지 못했습니다. Microsoft 공식 설치 안내를 열까요?"
#if APP_HAS_GUESTS
  L"\n설치를 원하지 않으면 브라우저 엔진을 포함한 호환판을 사용할 수 있습니다."
#endif
  ;
  if(MessageBoxW(nullptr,prompt,APP_TITLE L" · WebView2 필요",MB_YESNO|MB_ICONINFORMATION)==IDYES)
   ShellExecuteW(nullptr,L"open",L"https://developer.microsoft.com/microsoft-edge/webview2/",nullptr,nullptr,SW_SHOWNORMAL);
  if(loader)FreeLibrary(loader);CoUninitialize();CloseHandle(mutex);return 2;
 }
 INITCOMMONCONTROLSEX controls={sizeof(controls),ICC_BAR_CLASSES};InitCommonControlsEx(&controls);
 WNDCLASSEXW cls={};cls.cbSize=sizeof(cls);cls.lpfnWndProc=controlProcedure;cls.hInstance=instance;cls.hCursor=LoadCursorW(nullptr,IDC_ARROW);cls.lpszClassName=windowClass;cls.hIcon=LoadIconW(instance,MAKEINTRESOURCEW(1));RegisterClassExW(&cls);
 controlWindow=CreateWindowExW(WS_EX_TOOLWINDOW,windowClass,APP_TITLE,WS_POPUP,0,0,1,1,nullptr,nullptr,instance,nullptr);
 cls.lpfnWndProc=procedure;cls.lpszClassName=APP_WINDOW_CLASS L"View";RegisterClassExW(&cls);
 windowHandle=CreateWindowExW(WS_EX_TRANSPARENT|WS_EX_NOACTIVATE|WS_EX_TOOLWINDOW|WS_EX_NOREDIRECTIONBITMAP,cls.lpszClassName,APP_TITLE,WS_POPUP,0,0,1,1,nullptr,nullptr,instance,nullptr);
 SetPropW(controlWindow,L"HoribbanguPassive",(HANDLE)1);
 SetPropW(controlWindow,L"HoribbanguVisual",windowHandle);
 MARGINS margins={-1,-1,-1,-1};DwmExtendFrameIntoClientArea(windowHandle,&margins);
 taskbarCreated=RegisterWindowMessageW(L"TaskbarCreated");bounds();saveSettings();tray();RegisterHotKey(controlWindow,1,MOD_CONTROL|MOD_ALT,'H');RegisterHotKey(controlWindow,2,MOD_CONTROL|MOD_ALT,'Q');
 auto callback=new EnvironmentHandler;hr=create(nullptr,profileFolder,nullptr,callback);callback->Release();if(FAILED(hr))error(L"WebView2 환경을 만들지 못했습니다.",hr);
 MSG message;while(GetMessageW(&message,nullptr,0,0)>0){if(settingsWindow&&IsDialogMessageW(settingsWindow,&message))continue;TranslateMessage(&message);DispatchMessageW(&message);}
 if(controlWindow)DestroyWindow(controlWindow);
 if(webview)webview->Release();if(controller)controller->Release();if(composition)composition->Release();if(environment)environment->Release();
 if(opacityEffect)opacityEffect->Release();if(visual)visual->Release();if(target)target->Release();if(device)device->Release();FreeLibrary(loader);CoUninitialize();CloseHandle(mutex);return 0;
}
