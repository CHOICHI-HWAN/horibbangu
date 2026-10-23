"""Build both resident-only Windows EXEs and single-file download ZIPs."""
from pathlib import Path
import subprocess
import sys
ROOT=Path(__file__).resolve().parents[2]
for key in ['park','kim']:
 for script in ['desktop/windows/build-playground.py','desktop/windows/native/build.py','desktop/windows/native/package.py']:
  subprocess.run([sys.executable,str(ROOT/script),'--edition',key],cwd=ROOT,check=True)
