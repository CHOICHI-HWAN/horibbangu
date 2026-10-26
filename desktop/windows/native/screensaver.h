#pragma once
#include <stdint.h>
#include <wchar.h>

enum class LaunchMode { Desktop, Saver, Preview, Configure, Invalid };
struct SaverLaunch { LaunchMode mode; uintptr_t parent; };
static SaverLaunch saverLaunch(int argc, wchar_t** argv, bool scr) {
 if(argc<2)return {scr?LaunchMode::Configure:LaunchMode::Desktop,0};
 const wchar_t* arg=argv[1];
 if((arg[0]!=L'/'&&arg[0]!=L'-')||!arg[1])return {LaunchMode::Invalid,0};
 wchar_t option=arg[1];if(option>=L'A'&&option<=L'Z')option+=L'a'-L'A';
 if(option==L's'&&!arg[2]&&argc==2)return {LaunchMode::Saver,0};
 if(option!=L'c'&&option!=L'p')return {LaunchMode::Invalid,0};
 const wchar_t* number=arg+2;
 if(*number==L':')++number;
 else if(*number)return {LaunchMode::Invalid,0};
 if(!*number&&argc==3)number=argv[2];
 else if(argc!=2)return {LaunchMode::Invalid,0};
 if(!*number)return {option==L'c'?LaunchMode::Configure:LaunchMode::Invalid,0};
 uintptr_t parent=0;
 for(;*number;++number){
  if(*number<L'0'||*number>L'9'||parent>(UINTPTR_MAX-(*number-L'0'))/10)return {LaunchMode::Invalid,0};
  parent=parent*10+(*number-L'0');
 }
 if(!parent&&option==L'p')return {LaunchMode::Invalid,0};
 return {option==L'c'?LaunchMode::Configure:LaunchMode::Preview,parent};
}
