#pragma once
// One region-limited input window. No global mouse hooks, polling, or input
// forwarding outside the visible cats/buttons; the composition stays passive.
static HWND inputWindow;
static bool inputDown=false;
static POINT inputPoint={};
static ULONGLONG hitTime=0;
static bool hasHits=false;
static bool topLayer(){return isDesktop()&&layer==1;}
static void sendTopMouse(UINT message,WPARAM keys,POINT point,UINT32 data=0){
 if(topLayer()&&ready&&composition)
  composition->SendMouseInput((COREWEBVIEW2_MOUSE_EVENT_KIND)message,(COREWEBVIEW2_MOUSE_EVENT_VIRTUAL_KEYS)(keys&0x7f),data,point);
}
static void cancelTopInput(){
 bool down=inputDown;inputDown=false;
 if(down)sendTopMouse(WM_LBUTTONUP,0,inputPoint);
 if(inputWindow&&GetCapture()==inputWindow)ReleaseCapture();
 sendTopMouse(WM_MOUSELEAVE,0,{0,0});
}
static void raiseTopSettings(){
 if(!desktopMenuOpen&&settingsWindow&&IsWindowVisible(settingsWindow))SetWindowPos(settingsWindow,HWND_TOPMOST,0,0,0,0,SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE);
}
static void syncInputBounds(){
 if(!inputWindow)return;
 if(!topLayer()||!ready||desktopMenuOpen||!IsWindowVisible(windowHandle)||!hasHits||GetTickCount64()-hitTime>2000){
  cancelTopInput();ShowWindow(inputWindow,SW_HIDE);raiseTopSettings();return;
 }
 RECT r,current;GetWindowRect(windowHandle,&r);GetWindowRect(inputWindow,&current);
 if(!EqualRect(&r,&current)||!IsWindowVisible(inputWindow)){
  SetWindowPos(inputWindow,HWND_TOPMOST,r.left,r.top,r.right-r.left,r.bottom-r.top,SWP_NOACTIVATE|SWP_SHOWWINDOW);
  raiseTopSettings();
 }
}
static void acceptHitRegions(const wchar_t* text){
 if(!topLayer()||!ready||!inputWindow||wcslen(text)>10000)return;
 static wchar_t previous[10001]={};static RECT previousClient={};
 RECT client;GetClientRect(windowHandle,&client);
 if(hasHits&&EqualRect(&client,&previousClient)&&!wcscmp(previous,text)){hitTime=GetTickCount64();syncInputBounds();return;}
 const wchar_t* original=text;
 HRGN all=CreateRectRgn(0,0,0,0);if(!all)return;
 int count=0;bool any=false;
 while(*text&&count<64){
  LONG values[4];
  for(int i=0;i<4;i++){
   wchar_t* end=nullptr;long n=wcstol(text,&end,10);
   if(end==text||n < -100000||n>100000||(i<3?*end!=L',':*end!=L';'&&*end!=0)){DeleteObject(all);return;}
   values[i]=n;text=end+(*end?1:0);
  }
  RECT r={values[0],values[1],values[2],values[3]},clipped;
  if(IntersectRect(&clipped,&r,&client)&&!IsRectEmpty(&clipped)){
   HRGN part=CreateRectRgnIndirect(&clipped);
   if(!part||CombineRgn(all,all,part,RGN_OR)==ERROR){if(part)DeleteObject(part);DeleteObject(all);return;}
   DeleteObject(part);any=true;
  }++count;
 }
 if(*text){DeleteObject(all);return;}
 wcscpy(previous,original);
 previousClient=client;
 hitTime=GetTickCount64();hasHits=any;
 if(!SetWindowRgn(inputWindow,all,TRUE)){DeleteObject(all);hasHits=false;}
 syncInputBounds();
}
static LRESULT CALLBACK inputProcedure(HWND h,UINT message,WPARAM w,LPARAM l){
 if(message==WM_MOUSEACTIVATE)return MA_NOACTIVATE;
 if(message==WM_NCHITTEST)return topLayer()?HTCLIENT:HTTRANSPARENT;
 if(message==WM_ERASEBKGND)return 1;
 if(message==WM_PAINT){PAINTSTRUCT ps;HDC dc=BeginPaint(h,&ps);RECT r;GetClientRect(h,&r);FillRect(dc,&r,(HBRUSH)GetStockObject(BLACK_BRUSH));EndPaint(h,&ps);return 0;}
 if(message==WM_SETCURSOR){HCURSOR cursor=nullptr;if(composition)composition->get_Cursor(&cursor);SetCursor(cursor?cursor:LoadCursorW(nullptr,IDC_HAND));return TRUE;}
 if(message==WM_CAPTURECHANGED||message==WM_CANCELMODE){cancelTopInput();return 0;}
 if(!topLayer()||!ready)return DefWindowProcW(h,message,w,l);
 if(message==WM_MOUSEMOVE||message==WM_LBUTTONDOWN||message==WM_LBUTTONUP||message==WM_LBUTTONDBLCLK||message==WM_RBUTTONDOWN||message==WM_RBUTTONUP||message==WM_MBUTTONDOWN||message==WM_MBUTTONUP||message==WM_MOUSEWHEEL||message==WM_MOUSEHWHEEL){
  POINT point={GET_X_LPARAM(l),GET_Y_LPARAM(l)};
  if(message==WM_MOUSEWHEEL||message==WM_MOUSEHWHEEL)ScreenToClient(h,&point);
  inputPoint=point;
  if(message==WM_LBUTTONDOWN){inputDown=true;SetCapture(h);}
  if(message==WM_MOUSEMOVE){TRACKMOUSEEVENT track={sizeof(track),TME_LEAVE,h,0};TrackMouseEvent(&track);}
  sendTopMouse(message,w,point,message==WM_MOUSEWHEEL||message==WM_MOUSEHWHEEL?(UINT32)(INT32)GET_WHEEL_DELTA_WPARAM(w):0);
  if(message==WM_LBUTTONUP){inputDown=false;if(GetCapture()==h)ReleaseCapture();}
  return 0;
 }
 if(message==WM_MOUSELEAVE){if(!inputDown)sendTopMouse(WM_MOUSELEAVE,0,{0,0});return 0;}
 return DefWindowProcW(h,message,w,l);
}
static void createInputWindow(HINSTANCE instance){
 WNDCLASSEXW cls={};cls.cbSize=sizeof(cls);cls.lpfnWndProc=inputProcedure;cls.hInstance=instance;cls.lpszClassName=APP_WINDOW_CLASS L"Input";RegisterClassExW(&cls);
 inputWindow=CreateWindowExW(WS_EX_LAYERED|WS_EX_NOACTIVATE|WS_EX_TOOLWINDOW|WS_EX_TOPMOST,cls.lpszClassName,L"Horibbangu cat input",WS_POPUP,0,0,1,1,controlWindow,nullptr,instance,nullptr);
 if(inputWindow){SetLayeredWindowAttributes(inputWindow,0,1,LWA_ALPHA);SetWindowRgn(inputWindow,CreateRectRgn(0,0,0,0),FALSE);}
 SetPropW(controlWindow,L"HoribbanguInput",inputWindow);
}
static void setDesktopLayer(int next){
 if(!isDesktop()||(next!=1&&next!=2)||next==layer)return;
 cancelTopInput();hasHits=false;hitTime=0;if(inputWindow)ShowWindow(inputWindow,SW_HIDE);
 if(!ready){layer=next;saveSettings();return;}
 bool shown=IsWindowVisible(windowHandle);ShowWindow(windowHandle,SW_HIDE);
 if(next==1){
  SetLastError(0);HWND previous=SetParent(windowHandle,nullptr);DWORD failed=GetLastError();
  if(!previous&&failed){if(shown)ShowWindow(windowHandle,SW_SHOWNOACTIVATE);syncInputBounds();return;}
  LONG_PTR style=GetWindowLongPtrW(windowHandle,GWL_STYLE);
  SetWindowLongPtrW(windowHandle,GWL_STYLE,(style&~WS_CHILD)|WS_POPUP);
  SetWindowLongPtrW(windowHandle,GWLP_HWNDPARENT,0); // A popup must not retain Explorer as its owner.
  wallpaperParent=nullptr;wallpaperAfter=nullptr;layer=1;
 }else{
  layer=2;SetWindowPos(windowHandle,HWND_BOTTOM,0,0,0,0,SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE);
  if(!attachWallpaper()){
   SetParent(windowHandle,nullptr);wallpaperParent=nullptr;layer=1;
   SetWindowLongPtrW(windowHandle,GWL_STYLE,(GetWindowLongPtrW(windowHandle,GWL_STYLE)&~WS_CHILD)|WS_POPUP);
  }
 }
 EnableWindow(windowHandle,FALSE);bounds();if(shown)ShowWindow(windowHandle,SW_SHOWNOACTIVATE);
 command(layer==1?L"layer-top":L"layer-background");saveSettings();
 if(settingsWindow&&layerCheck)SendMessageW(layerCheck,BM_SETCHECK,layer==1?BST_CHECKED:BST_UNCHECKED,0);
 raiseTopSettings();
}
