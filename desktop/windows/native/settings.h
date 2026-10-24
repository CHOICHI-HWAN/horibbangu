#pragma once
#include <commctrl.h>

struct DisplayChoice {RECT work,screen;wchar_t device[32];bool primary;};
static DisplayChoice displays[32];
static int displayCount=0,layer=2,transparency=0;
static wchar_t selectedDisplay[32],settingsFile[2048];
static HWND settingsWindow,monitorCombo,opacitySlider,opacityLabel;
static HFONT settingsFont;
static const wchar_t* settingsClass=APP_SETTINGS_CLASS;
static void bounds();
static BOOL CALLBACK collectDisplay(HMONITOR monitor,HDC,LPRECT,LPARAM){
 if(displayCount>=32)return TRUE;
 MONITORINFOEXW info={};info.cbSize=sizeof(info);
 if(GetMonitorInfoW(monitor,&info)){
  auto& d=displays[displayCount++];d.work=info.rcWork;d.screen=info.rcMonitor;
  d.primary=(info.dwFlags&MONITORINFOF_PRIMARY)!=0;lstrcpynW(d.device,info.szDevice,32);
 }return TRUE;
}
static int refreshDisplays(){
 displayCount=0;EnumDisplayMonitors(nullptr,nullptr,collectDisplay,0);
 int primary=0;
 for(int i=0;i<displayCount;i++)if(displays[i].primary)primary=i;
 for(int i=0;i<displayCount;i++)if(!wcscmp(displays[i].device,selectedDisplay))return i;
 return primary;
}
static void saveSettings(){
 wchar_t text[32];
 WritePrivateProfileStringW(L"Desktop",L"Monitor",selectedDisplay,settingsFile);
 swprintf(text,32,L"%d",layer);WritePrivateProfileStringW(L"Desktop",L"Layer",text,settingsFile);
 swprintf(text,32,L"%d",transparency);WritePrivateProfileStringW(L"Desktop",L"Transparency",text,settingsFile);
}
static void loadSettings(){
 GetPrivateProfileStringW(L"Desktop",L"Monitor",L"",selectedDisplay,32,settingsFile);
 layer=2; // Older foreground/interactive preferences must not restore input.
 transparency=GetPrivateProfileIntW(L"Desktop",L"Transparency",0,settingsFile);if(transparency<0||transparency>80)transparency=0;
}
static void applyOpacity(){if(opacityEffect){opacityEffect->SetOpacity((100-transparency)/100.0f);if(device)device->Commit();}}
static void bounds(){
 int selected=refreshDisplays();RECT work={};
 if(displayCount)work=displays[selected].work;else SystemParametersInfoW(SPI_GETWORKAREA,0,&work,0);
 LONG_PTR style=GetWindowLongPtrW(windowHandle,GWL_EXSTYLE);
 SetWindowLongPtrW(windowHandle,GWL_EXSTYLE,(style&~WS_EX_LAYERED)|WS_EX_NOACTIVATE|WS_EX_TRANSPARENT|WS_EX_NOREDIRECTIONBITMAP);
 POINT position={work.left,work.top};if(wallpaperParent)ScreenToClient(wallpaperParent,&position);
 SetWindowPos(windowHandle,wallpaperParent?wallpaperAfter:HWND_BOTTOM,position.x,position.y,work.right-work.left,work.bottom-work.top,SWP_NOACTIVATE);
 if(controller){RECT area;GetClientRect(windowHandle,&area);controller->put_Bounds(area);controller->NotifyParentWindowPositionChanged();}
}
static void labelOpacity(){
 wchar_t text[96];swprintf(text,96,L"투명도: %d%%  (0%% = 선명하게)",transparency);SetWindowTextW(opacityLabel,text);
}
static void fillMonitors(){
 if(!monitorCombo)return;int selected=refreshDisplays();SendMessageW(monitorCombo,CB_RESETCONTENT,0,0);
 for(int i=0;i<displayCount;i++){
  auto& d=displays[i];wchar_t text[160];
  swprintf(text,160,L"%ls · %ld × %ld%ls",wcsstr(d.device,L"DISPLAY")?wcsstr(d.device,L"DISPLAY"):d.device,d.screen.right-d.screen.left,d.screen.bottom-d.screen.top,d.primary?L" · 주 모니터":L"");
  SendMessageW(monitorCombo,CB_ADDSTRING,0,(LPARAM)text);
 }SendMessageW(monitorCombo,CB_SETCURSEL,selected,0);
}
static LRESULT CALLBACK settingsProcedure(HWND h,UINT message,WPARAM w,LPARAM l){
 if(message==WM_HSCROLL&&reinterpret_cast<HWND>(l)==opacitySlider){
  transparency=(int)SendMessageW(opacitySlider,TBM_GETPOS,0,0);applyOpacity();labelOpacity();saveSettings();return 0;
 }
 if(message==WM_COMMAND){
  int id=LOWORD(w);
  if(id==201&&HIWORD(w)==CBN_SELCHANGE){int i=(int)SendMessageW(monitorCombo,CB_GETCURSEL,0,0);if(i>=0&&i<displayCount){lstrcpynW(selectedDisplay,displays[i].device,32);bounds();saveSettings();}return 0;}
  if(id==IDCANCEL){DestroyWindow(h);return 0;}
 }
 if(message==WM_DISPLAYCHANGE){bounds();fillMonitors();return 0;}
 if(message==WM_CLOSE){DestroyWindow(h);return 0;}
 if(message==WM_DESTROY){settingsWindow=nullptr;monitorCombo=nullptr;if(settingsFont){DeleteObject(settingsFont);settingsFont=nullptr;}return 0;}
 return DefWindowProcW(h,message,w,l);
}
static void openSettings(){
 if(settingsWindow){ShowWindow(settingsWindow,SW_SHOW);SetForegroundWindow(settingsWindow);return;}
 WNDCLASSEXW cls={};cls.cbSize=sizeof(cls);cls.lpfnWndProc=settingsProcedure;cls.hInstance=GetModuleHandleW(nullptr);cls.hCursor=LoadCursorW(nullptr,IDC_ARROW);cls.lpszClassName=settingsClass;cls.hbrBackground=(HBRUSH)(COLOR_BTNFACE+1);RegisterClassExW(&cls);
 int selected=refreshDisplays();RECT work=displayCount?displays[selected].work:RECT{0,0,800,600};
 settingsWindow=CreateWindowExW(WS_EX_TOOLWINDOW,settingsClass,APP_TITLE L" · 화면 설정",WS_OVERLAPPED|WS_CAPTION|WS_SYSMENU,work.left+80,work.top+80,440,300,controlWindow,nullptr,cls.hInstance,nullptr);
 if(!settingsWindow)return;
 int dpi=(int)GetDpiForWindow(settingsWindow);if(!dpi)dpi=96;
 auto scale=[dpi](int n){return MulDiv(n,dpi,96);};
 RECT form={0,0,scale(420),scale(255)};AdjustWindowRectExForDpi(&form,WS_OVERLAPPED|WS_CAPTION|WS_SYSMENU,FALSE,WS_EX_TOOLWINDOW,dpi);
 SetWindowPos(settingsWindow,HWND_TOP,work.left+scale(40),work.top+scale(40),form.right-form.left,form.bottom-form.top,SWP_NOACTIVATE);
 settingsFont=CreateFontW(-MulDiv(10,dpi,72),0,0,0,FW_NORMAL,FALSE,FALSE,FALSE,DEFAULT_CHARSET,0,0,CLEARTYPE_QUALITY,0,L"Segoe UI");
 auto control=[&](LPCWSTR kind,LPCWSTR text,DWORD style,int x,int y,int width,int height,int id){
  HWND child=CreateWindowExW(0,kind,text,WS_CHILD|WS_VISIBLE|style,scale(x),scale(y),scale(width),scale(height),settingsWindow,(HMENU)(INT_PTR)id,cls.hInstance,nullptr);
  SendMessageW(child,WM_SETFONT,(WPARAM)settingsFont,TRUE);return child;
 };
 control(L"STATIC",L"고양이들이 지낼 모니터",0,20,16,380,22,0);
 monitorCombo=control(L"COMBOBOX",L"",CBS_DROPDOWNLIST|WS_TABSTOP|WS_VSCROLL,20,42,380,180,201);fillMonitors();
 opacityLabel=control(L"STATIC",L"",0,20,83,380,22,0);labelOpacity();
 opacitySlider=control(TRACKBAR_CLASSW,L"",TBS_HORZ|TBS_NOTICKS|WS_TABSTOP,16,108,388,32,202);
 SendMessageW(opacitySlider,TBM_SETRANGE,TRUE,MAKELPARAM(0,80));SendMessageW(opacitySlider,TBM_SETPOS,TRUE,transparency);
 control(L"STATIC",L"감상 전용 배경 · 모든 클릭은 바탕화면으로 통과합니다.",0,20,153,390,30,0);
 control(L"STATIC",L"설정은 자동으로 저장됩니다.",0,20,194,260,22,0);
 control(L"BUTTON",L"닫기",BS_DEFPUSHBUTTON|WS_TABSTOP,320,211,80,28,IDCANCEL);
 ShowWindow(settingsWindow,SW_SHOW);SetForegroundWindow(settingsWindow);
}
