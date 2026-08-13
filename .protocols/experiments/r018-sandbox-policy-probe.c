#include <dlfcn.h>
#include <stdio.h>
#include <unistd.h>

typedef int (*sandbox_check_fn)(pid_t, const char *, int, ...);

int main(void) {
    sandbox_check_fn check = (sandbox_check_fn)dlsym(RTLD_DEFAULT, "sandbox_check");
    if (check == NULL) {
        fputs("{\"error\":\"sandbox_check_unavailable\"}\n", stdout);
        return 2;
    }

    /* SANDBOX_FILTER_GLOBAL_NAME is 2 in the private sandbox_check ABI. */
    int securityd = check(getpid(), "mach-lookup", 2, "com.apple.securityd");
    int securityd_xpc = check(getpid(), "mach-lookup", 2, "com.apple.securityd.xpc");
    printf("{\"com.apple.securitydDenied\":%s,\"com.apple.securityd.xpcDenied\":%s}\n",
        securityd == 1 ? "true" : "false",
        securityd_xpc == 1 ? "true" : "false");
    return (securityd == 1 && securityd_xpc == 1) ? 0 : 3;
}
