#include "screensaver.h"
#include <assert.h>
static SaverLaunch parse(const wchar_t* arg=nullptr,const wchar_t* parent=nullptr,bool scr=false){
 wchar_t* argv[]={const_cast<wchar_t*>(L"cats.exe"),const_cast<wchar_t*>(arg),const_cast<wchar_t*>(parent)};
 return saverLaunch(arg?(parent?3:2):1,argv,scr);
}
int main(){
 assert(parse().mode==LaunchMode::Desktop);
 assert(parse(nullptr,nullptr,true).mode==LaunchMode::Configure);
 assert(parse(L"/S").mode==LaunchMode::Saver);
 assert(parse(L"-s").mode==LaunchMode::Saver);
 assert(parse(L"/c").mode==LaunchMode::Configure);
 assert(parse(L"/c:42").parent==42);
 assert(parse(L"/p",L"4294967297").parent==4294967297ull);
 assert(parse(L"/p:42").mode==LaunchMode::Preview);
 assert(parse(L"/p").mode==LaunchMode::Invalid);
 assert(parse(L"/p:0").mode==LaunchMode::Invalid);
 assert(parse(L"/p:-1").mode==LaunchMode::Invalid);
 assert(parse(L"/p:999999999999999999999999").mode==LaunchMode::Invalid);
 assert(parse(L"/p:42",L"43").mode==LaunchMode::Invalid);
 assert(parse(L"/s",L"42").mode==LaunchMode::Invalid);
 assert(parse(L"/something").mode==LaunchMode::Invalid);
}
