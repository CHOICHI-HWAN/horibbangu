"""Real mouse regression on a Win32 icon ListView, including overlap/stale hits.

Run only on the disposable Windows test desktop. No user desktop files are made.
"""
import ctypes as C
import ctypes.wintypes as W
import json
import threading
import time


def verify_background_input(u, pump, hwnd, under, evaluate, out, width, height, settings_class='HoribbanguDesktopSettings'):
 class InitControls(C.Structure):
  _fields_=[('size',W.DWORD),('classes',W.DWORD)]
 common=C.WinDLL('comctl32');common.InitCommonControlsEx(C.byref(InitControls(8,1)))
 class Item(C.Structure):
  _fields_=[('mask',W.UINT),('index',C.c_int),('subitem',C.c_int),('state',W.UINT),('stateMask',W.UINT),('text',W.LPWSTR),('textMax',C.c_int),('image',C.c_int),('param',W.LPARAM),('indent',C.c_int),('group',C.c_int),('columns',W.UINT),('columnArray',C.c_void_p),('formats',C.c_void_p),('groupIndex',C.c_int)]
 class Header(C.Structure):
  _fields_=[('sender',W.HWND),('id',C.c_size_t),('code',C.c_int)]
 callback_type=C.WINFUNCTYPE(C.c_ssize_t,W.HWND,W.UINT,W.WPARAM,W.LPARAM)
 u.SetWindowLongPtrW.argtypes=[W.HWND,C.c_int,C.c_ssize_t];u.SetWindowLongPtrW.restype=C.c_ssize_t
 u.CallWindowProcW.argtypes=[C.c_void_p,W.HWND,W.UINT,W.WPARAM,W.LPARAM];u.CallWindowProcW.restype=C.c_ssize_t
 notifications=[];icons=None
 def receive(h,m,w,l):
  if m==0x004e:
   header=C.cast(l,C.POINTER(Header)).contents
   if header.sender==icons:notifications.append(header.code)
  return u.CallWindowProcW(original,h,m,w,l)
 callback=callback_type(receive)
 original=u.SetWindowLongPtrW(under,-4,C.cast(callback,C.c_void_p).value)
 icons=u.CreateWindowExW(0,'SysListView32','Desktop icon regression',0x50000000,0,0,width,height,under,None,None,None)
 assert icons,'Cannot create Win32 icon ListView'
 label=C.create_unicode_buffer('Desktop icon')
 item=Item();item.mask=1;item.text=C.cast(label,W.LPWSTR)
 assert u.SendMessageW(icons,0x104d,0,C.addressof(item))==0  # LVM_INSERTITEMW
 position=W.POINT(180,180)
 u.SendMessageW(icons,0x1031,0,C.addressof(position))  # LVM_SETITEMPOSITION32
 rect=W.RECT();assert u.SendMessageW(icons,0x100e,0,C.addressof(rect))
 center=W.POINT((rect.left+rect.right)//2,(rect.top+rect.bottom)//2)
 u.ClientToScreen.argtypes=[W.HWND,C.POINTER(W.POINT)];u.ClientToScreen(icons,C.byref(center))
 x,y=center.x,center.y
 checks=[]
 def mode(value):
  u.PostMessageW(hwnd,0x0111,110,0);pump(.08)
  settings=u.FindWindowW(settings_class,None);assert settings
  u.SendMessageW(settings,0x0111,204+value,0)
  u.SendMessageW(settings,0x0010,0,0);pump(.08)
 def expose():
  u.SetWindowPos(under,0,0,0,0,0,0x53);pump(.03)
  # Simulate Explorer/other shell rearranging Z-order. Background input must
  # pass through even if our visual temporarily sits above the desktop icons.
  u.SetWindowPos(hwnd,0,0,0,0,0,0x413)  # NOSENDCHANGING | NOACTIVATE | NOMOVE | NOSIZE
  u.SetCursorPos(x,y)
  # A stale/late renderer hit rectangle must never reactivate interception.
  evaluate(f"desktopHost.setInteractive(true,[{x-10},{y-10},{x+10},{y+10}])")
  pump(.03)
 def click(right=False):
  # ListView's mouse-down handler runs a tracking loop until button-up. Its
  # owning thread must keep dispatching while a different thread releases it.
  def buttons():
   u.mouse_event(0x0008 if right else 0x0002,0,0,0,0);time.sleep(.03)
   u.mouse_event(0x0010 if right else 0x0004,0,0,0,0)
  producer=threading.Thread(target=buttons);producer.start();pump(.13);producer.join(timeout=1)
  assert not producer.is_alive()
 try:
  print('Icon control ready; entering background mode.',flush=True)
  mode(2)
  evaluate("window.backgroundDowns=0;window.backgroundCount=e=>{if(e.type==='pointerdown')backgroundDowns++};addEventListener('pointerdown',backgroundCount,true)")
  # Queued mouse messages from the preceding interactive mode must be ignored.
  for message in (0x201,0x202):u.PostMessageW(hwnd,0x8003,message,(y<<16)|(x&0xffff))
  pump(.1);assert evaluate('backgroundDowns')==0,'Queued interactive input leaked into background mode'
  for background in (False,True):
   print('Checking icon gestures, painted background:',background,flush=True)
   evaluate('setDesktopBackground('+str(background).lower()+')')
   u.SendMessageW(icons,0x102b,-1,C.addressof(Item(stateMask=2)))  # deselect all
   notifications.clear();expose();click()
   assert u.SendMessageW(icons,0x102c,0,2)&2,'Background overlay swallowed icon selection'
   print('Icon selection passed.',flush=True)
   checks.append(f'icon selection with background {background}')
   notifications.clear();expose();click();click()
   assert -3 in notifications,('Background overlay swallowed icon double-click',notifications)
   print('Icon double-click passed.',flush=True)
   checks.append(f'icon double-click with background {background}')
   notifications.clear();expose();click(True)
   assert -5 in notifications,('Background overlay swallowed icon right-click',notifications)
   print('Icon right-click passed.',flush=True)
   checks.append(f'icon right-click with background {background}')
   notifications.clear();expose()
   def drag():
    u.mouse_event(0x0002,0,0,0,0);time.sleep(.03)
    for step in range(1,5):
     u.mouse_event(0x8001,round((x+step*12)*65535/(width-1)),round((y+step*6)*65535/(height-1)),0,0);time.sleep(.03)
    u.mouse_event(0x0004,0,0,0,0)
   producer=threading.Thread(target=drag);producer.start();pump(.25);producer.join(timeout=1)
   assert not producer.is_alive()
   assert -109 in notifications,('Background overlay swallowed icon drag',notifications)
   print('Icon drag passed.',flush=True)
   assert evaluate('backgroundDowns')==0,'Background app consumed desktop input'
   checks.append(f'icon drag with background {background}')
  # Native tray/hotkey access must stay usable in display-only mode.
  u.PostMessageW(hwnd,0x0312,1,0);pump(.1)
  settings=u.FindWindowW(settings_class,None);assert settings
  u.SendMessageW(settings,0x0111,204,0);u.SendMessageW(settings,0x0010,0,0);pump(.1)
  evaluate('setDesktopBackground(false);removeEventListener("pointerdown",backgroundCount,true)')
  (out/'background-input.json').write_text(json.dumps({'ok':True,'checks':checks},indent=2))
  print('Background mode: real icon selection, double-click, right-click and drag pass through with/without scenery.',flush=True)
 finally:
  u.SetWindowLongPtrW(under,-4,original)
  u.DestroyWindow(icons)
