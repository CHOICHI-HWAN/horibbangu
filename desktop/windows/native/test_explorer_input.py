"""Exercise a temporary shortcut on the real, disposable Windows CI desktop."""
from pathlib import Path
import base64
import ctypes as C
import ctypes.wintypes as W
import json
import os
import subprocess
import time

def verify_explorer_input(u,pump,hwnd,under,evaluate,edition,out):
 name='Horibbangu CI icon'
 marker=out/'shortcut-opened.txt'
 powershell=Path(os.environ['WINDIR'])/'System32/WindowsPowerShell/v1.0/powershell.exe'
 def ps(script):
  encoded=base64.b64encode(script.encode('utf-16-le')).decode()
  return subprocess.run([str(powershell),'-NoProfile','-EncodedCommand',encoded],capture_output=True,text=True,check=True,timeout=20).stdout.strip()
 marker_text=str(marker).replace("'","''")
 encoded=base64.b64encode(("[IO.File]::WriteAllText('"+marker_text+"','opened')").encode('utf-16-le')).decode()
 path=Path(ps("$p=Join-Path ([Environment]::GetFolderPath('DesktopDirectory')) '"+name+".lnk';$s=(New-Object -ComObject WScript.Shell).CreateShortcut($p);$s.TargetPath='"+str(powershell).replace("'","''")+"';$s.Arguments='-NoProfile -WindowStyle Hidden -EncodedCommand "+encoded+"';$s.Save();Write-Output $p"))
 probe=edition['build']/'desktop-probe.exe'
 def inspect():
  result=subprocess.run([str(probe),name],capture_output=True,text=True,timeout=10)
  return json.loads(result.stdout) if result.returncode==0 else None
 def click():
  u.mouse_event(2,0,0,0,0);pump(.04);u.mouse_event(4,0,0,0,0);pump(.08)
 try:
  icon=None
  for _ in range(30):
   icon=inspect()
   if icon:break
   pump(.2)
  assert icon,'Real Explorer did not expose the test desktop shortcut'
  print('Real Explorer shortcut:',icon,flush=True)
  x,y=icon['x']+24,icon['y']+32
  u.ShowWindow(under,0)
  # Expose the desktop. Only disposable CI windows are minimized.
  callback_type=C.WINFUNCTYPE(W.BOOL,W.HWND,W.LPARAM)
  u.GetClassNameW.argtypes=[W.HWND,W.LPWSTR,C.c_int]
  def minimize(h,l):
   text=C.create_unicode_buffer(128);u.GetClassNameW(h,text,128)
   if h!=hwnd and not text.value.startswith('Chrome_') and u.IsWindowVisible(h) and text.value not in ['Progman','WorkerW','Shell_TrayWnd','Shell_SecondaryTrayWnd']:u.ShowWindow(h,6)
   return True
  callback=callback_type(minimize);u.EnumWindows(callback,0);pump(.2)
  # Put an actual cat and stale/full-screen hit request over the icon. Every
  # physical gesture must still reach Explorer rather than this visual.
  evaluate(f"(()=>{{window.explorerDowns=0;addEventListener('pointerdown',()=>explorerDowns++);const s=document.createElement('style');s.id='ci-icon-overlap';s.textContent='.ci-icon-cat{{position:fixed!important;left:{x-30}px!important;top:{y-20}px!important;bottom:auto!important;transform:none!important;}}';document.head.append(s);cats[0].el.classList.add('ci-icon-cat');desktopHost.setInteractive(true,[0,0,innerWidth,innerHeight]);}})()")
  def expose():
   u.SetCursorPos(x,y);pump(.03)
  expose();click();pump(.2)
  after=inspect()
  if not after or not after['selected']:
   u.WindowFromPoint.argtypes=[W.POINT];u.WindowFromPoint.restype=W.HWND
   hit=u.WindowFromPoint(W.POINT(x,y));cls=C.create_unicode_buffer(128);u.GetClassNameW(hit,cls,128)
   print('Icon hit diagnostic:',{'point':[x,y],'window':int(hit or 0),'class':cls.value},flush=True)
  assert after and after['selected'],('Real desktop icon selection failed',after)
  # Leave the double-click interval after the selection click.
  pump(.6);expose();click();click()
  for _ in range(50):
   if marker.exists():break
   pump(.1)
  assert marker.exists(),'Double-click did not launch the real desktop shortcut'
  expose();u.mouse_event(8,0,0,0,0);pump(.04);u.mouse_event(16,0,0,0,0);pump(.2)
  u.keybd_event(0x1b,0,0,0);u.keybd_event(0x1b,0,2,0);pump(.2)
  u.keybd_event(0x1b,0,0,0);u.keybd_event(0x1b,0,2,0);pump(.1)
  expose();u.mouse_event(2,0,0,0,0);pump(.05)
  u.mouse_event(0x8001,round((x+120)*65535/(u.GetSystemMetrics(0)-1)),round((y+90)*65535/(u.GetSystemMetrics(1)-1)),0,0);pump(.1)
  u.mouse_event(4,0,0,0,0);pump(.15)
  assert evaluate('explorerDowns')==0,'A desktop gesture reached the cat renderer'
  (out/'explorer-input.json').write_text(json.dumps({'ok':True,'icon':icon,'checks':['real icon selected','real shortcut launched by double-click','right-click and drag delivered without cat events']},indent=2))
  print('Real Explorer icon selection, shortcut launch, right-click and drag verified.',flush=True)
 finally:
  path.unlink(missing_ok=True)
  evaluate("document.querySelector('#ci-icon-overlap')?.remove();cats[0].el.classList.remove('ci-icon-cat')")
