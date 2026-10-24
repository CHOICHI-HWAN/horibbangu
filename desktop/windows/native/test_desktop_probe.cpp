// CI-only fixture: query real Explorer desktop icons through supported Shell COM.
// This executable is never packaged or run on a user's PC.
#ifndef UNICODE
#define UNICODE
#endif
#define _UNICODE
#include <windows.h>
#include <shlobj.h>
#include <exdisp.h>
#include <shlwapi.h>
#include <stdio.h>

int wmain(int argc,wchar_t** argv){
 SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
 if(FAILED(CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED)))return 1;
 IShellWindows* windows=nullptr;IDispatch* dispatch=nullptr;IServiceProvider* services=nullptr;
 IShellBrowser* browser=nullptr;IShellView* view=nullptr;IFolderView* folder=nullptr;IShellFolder* shellFolder=nullptr;
 HRESULT hr=CoCreateInstance(CLSID_ShellWindows,nullptr,CLSCTX_LOCAL_SERVER,IID_IShellWindows,(void**)&windows);
 VARIANT location={},empty={};location.vt=VT_I4;location.lVal=CSIDL_DESKTOP;long hwnd=0;
 if(SUCCEEDED(hr))hr=windows->FindWindowSW(&location,&empty,SWC_DESKTOP,&hwnd,SWFO_NEEDDISPATCH,&dispatch);
 if(SUCCEEDED(hr)&&!dispatch)hr=E_FAIL;
 if(SUCCEEDED(hr))hr=dispatch->QueryInterface(IID_IServiceProvider,(void**)&services);
 if(SUCCEEDED(hr))hr=services->QueryService(SID_STopLevelBrowser,IID_IShellBrowser,(void**)&browser);
 if(SUCCEEDED(hr))hr=browser->QueryActiveShellView(&view);
 if(SUCCEEDED(hr))hr=view->QueryInterface(IID_IFolderView,(void**)&folder);
 if(SUCCEEDED(hr))hr=folder->GetFolder(IID_IShellFolder,(void**)&shellFolder);
 bool found=false;
 if(SUCCEEDED(hr)){
  IFolderView2* second=nullptr;
  if(SUCCEEDED(view->QueryInterface(IID_IFolderView2,(void**)&second))){DWORD flags=0;if(SUCCEEDED(second->GetCurrentFolderFlags(&flags))&&(flags&FWF_NOICONS))second->SetCurrentFolderFlags(FWF_NOICONS,0);second->Release();}
  HWND viewWindow=nullptr;view->GetWindow(&viewWindow);
  int count=0,selected=0,marked=-1;POINT spacing={75,80};folder->GetSpacing(&spacing);
  folder->ItemCount(SVGIO_ALLVIEW,&count);folder->ItemCount(SVGIO_SELECTION,&selected);folder->GetSelectionMarkedItem(&marked);
  for(int i=0;i<count;i++){
   PITEMID_CHILD pidl=nullptr;POINT p={};STRRET text={};wchar_t name[1024]={};
   if(FAILED(folder->Item(i,&pidl)))continue;
   if(SUCCEEDED(shellFolder->GetDisplayNameOf(pidl,SHGDN_INFOLDER,&text)))StrRetToBufW(&text,pidl,name,1024);
   if(argc>1&&wcsstr(name,argv[1])&&SUCCEEDED(folder->GetItemPosition(pidl,&p))){
    ClientToScreen(viewWindow,&p);
    printf("{\"x\":%ld,\"y\":%ld,\"spacingX\":%ld,\"spacingY\":%ld,\"selected\":%s}\n",p.x,p.y,spacing.x,spacing.y,selected==1&&marked==i?"true":"false");found=true;
   }
   CoTaskMemFree(pidl);
  }
 }
 if(shellFolder)shellFolder->Release();if(folder)folder->Release();if(view)view->Release();if(browser)browser->Release();if(services)services->Release();if(dispatch)dispatch->Release();if(windows)windows->Release();CoUninitialize();
 if(!found)fprintf(stderr,"Desktop fixture not found, HRESULT 0x%08lx\n",(unsigned long)hr);
 return found?0:1;
}
