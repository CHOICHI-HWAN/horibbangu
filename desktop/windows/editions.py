"""Build-time desktop editions; never read remote or user-supplied configuration."""
from pathlib import Path
import argparse
import json

ROOT=Path(__file__).resolve().parents[2]
VERSION=json.loads((ROOT/'desktop/windows/package.json').read_text())['version']
STANDALONE_VERSION='3.2.1'
EDITIONS={
 'default': {'title':'호리빵구 · 바탕화면 친구들','label':'기본','suffix':'','cats':None,'exe':'호리빵구.exe','archive':'Horibbangu-Windows.zip'},
 'park': {'title':'호리빵구 · 박박사 버전','label':'박박사','suffix':'-Park','cats':['소양','소미'],'exe':'호리빵구-박박사.exe','archive':'Horibbangu-Park-Windows.zip'},
 'kim': {'title':'호리빵구 · 김박사 버전','label':'김박사','suffix':'-Kim','cats':['팡이'],'exe':'호리빵구-김박사.exe','archive':'Horibbangu-Kim-Windows.zip'},
}
def edition_config(key='default'):
 e=dict(EDITIONS[key]);e['key']=key
 e['version']=VERSION
 e['archive_alias']=e['archive']
 e['archive']=e['archive'].replace('.zip','-v'+VERSION+'.zip')
 e['download_exe']=e['exe'].replace('.exe','-v'+VERSION+'.exe')
 e['saver_scr']=e['exe'].replace('.exe','-화면보호기-v'+VERSION+'.scr')
 e['saver_archive']=e['archive'].replace('-Windows-v','-Screensaver-v')
 e['build']=ROOT/('build/windows-native'+('' if key=='default' else '-'+key))
 e['renderer']=ROOT/'desktop/windows' if key=='default' else ROOT/'build/editions'/key
 e['data']='HoribbanguDesktop'+e['suffix']
 e['window_class']='HoribbanguWebView2Desktop'+e['suffix']
 e['settings_class']='HoribbanguDesktopSettings'+e['suffix']
 e['mutex']='Local\\'+e['window_class']
 e['verification']=ROOT/('build/native-verification'+('' if key=='default' else '-'+key))
 return e
def download_archives():
 names=[]
 for key in EDITIONS:
  e=edition_config(key);names.extend([e['archive'],e['archive_alias'],e['saver_archive']])
 return names+['Horibbangu-Windows-Standalone-v'+STANDALONE_VERSION+'.zip','Horibbangu-Windows-Standalone.zip']
def requested_edition():
 parser=argparse.ArgumentParser();parser.add_argument('--edition',choices=EDITIONS,default='default')
 return edition_config(parser.parse_args().edition)
