#pragma once
#include <basetsd.h>
// WinRT event token ABI, absent from the cross compiler's Win32 header set.
typedef struct EventRegistrationToken { INT64 value; } EventRegistrationToken;
