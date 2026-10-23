"""Shared, pinned esbuild compiler for Hosting and desktop artifacts."""
from pathlib import Path
import os,shutil,subprocess
ROOT=Path(__file__).resolve().parents[1]
def compile_file(source,target,mode='html'):
    node=os.environ.get('NODE_BIN') or shutil.which('node') or str(Path.home()/'.local/node/bin/node')
    subprocess.run([node,str(ROOT/'scripts/compile-js.cjs'),mode,str(source),str(target)],check=True,cwd=ROOT)
