#define WIN32_LEAN_AND_MEAN
#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif
#include <windows.h>
#include <shellapi.h>
#include <shlwapi.h>
#include <objbase.h>
#include <strsafe.h>

#define PATH_CAP 4096
static const WCHAR *const APP_TITLE = L"호리빵구 작은 친구들";

/* Materialize the embedded offline playground in this app's own directory.
   No URLs are downloaded and no weight records or credentials are accessed. */
static BOOL unpack_playground(HINSTANCE instance, WCHAR *directory, WCHAR *html_path) {
    DWORD length = GetEnvironmentVariableW(L"LOCALAPPDATA", directory, PATH_CAP);
    if (!length || length >= PATH_CAP) return FALSE;
    if (FAILED(StringCchCatW(directory, PATH_CAP, L"\\HoribbanguPlayground"))) return FALSE;
    if (!CreateDirectoryW(directory, NULL) && GetLastError() != ERROR_ALREADY_EXISTS) return FALSE;
    if (FAILED(StringCchPrintfW(html_path, PATH_CAP, L"%s\\playground.html", directory))) return FALSE;

    HRSRC resource = FindResourceW(instance, MAKEINTRESOURCEW(2), RT_RCDATA);
    if (!resource) return FALSE;
    DWORD size = SizeofResource(instance, resource);
    HGLOBAL loaded = LoadResource(instance, resource);
    const void *data = loaded ? LockResource(loaded) : NULL;
    if (!data || !size) return FALSE;

    WCHAR temporary[PATH_CAP];
    if (FAILED(StringCchPrintfW(temporary, PATH_CAP, L"%s\\playground-%lu.tmp", directory, GetCurrentProcessId()))) return FALSE;
    HANDLE file = CreateFileW(temporary, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (file == INVALID_HANDLE_VALUE) return FALSE;
    DWORD written = 0;
    BOOL ok = WriteFile(file, data, size, &written, NULL) && written == size;
    if (ok) ok = FlushFileBuffers(file);
    CloseHandle(file);
    if (ok) ok = MoveFileExW(temporary, html_path, MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH);
    if (!ok) DeleteFileW(temporary);
    return ok;
}

static BOOL find_browser(WCHAR *browser) {
    const WCHAR *roots[] = {L"ProgramFiles(x86)", L"ProgramFiles", L"LOCALAPPDATA"};
    const WCHAR *paths[] = {L"Microsoft\\Edge\\Application\\msedge.exe", L"Google\\Chrome\\Application\\chrome.exe", L"BraveSoftware\\Brave-Browser\\Application\\brave.exe"};
    for (unsigned p = 0; p < ARRAYSIZE(paths); ++p) {
        for (unsigned r = 0; r < ARRAYSIZE(roots); ++r) {
            WCHAR root[PATH_CAP];
            DWORD length = GetEnvironmentVariableW(roots[r], root, PATH_CAP);
            if (!length || length >= PATH_CAP) continue;
            if (FAILED(StringCchPrintfW(browser, PATH_CAP, L"%s\\%s", root, paths[p]))) continue;
            DWORD attributes = GetFileAttributesW(browser);
            if (attributes != INVALID_FILE_ATTRIBUTES && !(attributes & FILE_ATTRIBUTE_DIRECTORY)) return TRUE;
        }
    }
    return FALSE;
}

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE previous, PWSTR command_line, int show) {
    (void)previous; (void)command_line; (void)show;
    HRESULT com = CoInitializeEx(NULL, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);
    WCHAR directory[PATH_CAP], html_path[PATH_CAP], browser[PATH_CAP];
    BOOL opened = FALSE;
    if (unpack_playground(instance, directory, html_path)) {
        if (find_browser(browser)) {
            WCHAR url[PATH_CAP * 3], arguments[PATH_CAP * 5];
            DWORD url_length = ARRAYSIZE(url);
            if (SUCCEEDED(UrlCreateFromPathW(html_path, url, &url_length, 0)) &&
                SUCCEEDED(StringCchPrintfW(arguments, ARRAYSIZE(arguments),
                    L"--app=\"%s\" --window-size=1000,760 --no-first-run --no-default-browser-check --disable-background-mode --user-data-dir=\"%s\\browser-data\"",
                    url, directory))) {
                opened = (INT_PTR)ShellExecuteW(NULL, L"open", browser, arguments, directory, SW_SHOWNORMAL) > 32;
            }
        }
        /* Other browsers can still display the same embedded offline playground. */
        if (!opened) opened = (INT_PTR)ShellExecuteW(NULL, L"open", html_path, NULL, directory, SW_SHOWNORMAL) > 32;
    }
    if (SUCCEEDED(com)) CoUninitialize();
    if (!opened) {
        MessageBoxW(NULL,
            L"고양이 놀이터를 열지 못했어요.\n\n"
            L"Microsoft Edge 또는 Chrome이 설치되어 있는지,\n"
            L"이 사용자 폴더에 파일을 저장할 수 있는지 확인해 주세요.\n\n"
            L"놀이터에는 인터넷 연결이나 로그인이 필요하지 않습니다.",
            APP_TITLE, MB_OK | MB_ICONINFORMATION);
        return 1;
    }
    return 0;
}
