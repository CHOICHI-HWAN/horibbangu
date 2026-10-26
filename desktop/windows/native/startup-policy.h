#pragma once
#include <stdint.h>

// Two delayed retries, each with a fresh environment. Never loop indefinitely or
// retry permission/unsupported-runtime errors that need user intervention.
static unsigned startupRetryDelay(uint32_t code, unsigned retries) {
 if (retries >= 2) return 0;
 switch (code) {
 case 0x80080005u: // CO_E_SERVER_EXEC_FAILURE
 case 0x80004005u: // E_FAIL
 case 0x800706BAu: // RPC_S_SERVER_UNAVAILABLE
 case 0x80010108u: // RPC_E_DISCONNECTED
 case 0x800705B4u: // ERROR_TIMEOUT
 case 0x800700AAu: // ERROR_BUSY
  return retries ? 3000 : 1000;
 default: return 0;
 }
}
