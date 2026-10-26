#include "startup-policy.h"
#include <assert.h>
#include <initializer_list>
int main(){
 for(uint32_t code : {0x80080005u,0x80004005u,0x800706BAu,0x80010108u,0x800705B4u,0x800700AAu}){
  assert(startupRetryDelay(code,0)==1000);
  assert(startupRetryDelay(code,1)==3000);
  assert(startupRetryDelay(code,2)==0);
  assert(startupRetryDelay(code,100)==0);
 }
 for(uint32_t code : {0u,0x80070005u,0x80004002u,0x80004003u,0x80070057u})assert(startupRetryDelay(code,0)==0);
}
