#define _GNU_SOURCE
#include <ctype.h>
#include <dirent.h>
#include <errno.h>
#include <fcntl.h>
#include <getopt.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/xattr.h>
#include <time.h>
#include <unistd.h>

int main(int argc, char **argv)
{
    int result;
    char* path = argv[1];
    if (lgetxattr(path, "security.capability", &result, sizeof(int)) != sizeof(int)) {
        printf("lgetxattr wrong\n");
    }
    printf("%d\n", result);
    printf("%d\n", errno);
    return 0;
}
