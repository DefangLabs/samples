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
    char xattrbuf[1024];
    char* path = argv[1];
    printf("Path    : %s\n", path);

    int xattrlen = lgetxattr(path, "security.capability", xattrbuf, 1023);
    if (xattrlen == -1) {
        printf("lgetxattr errno : %d\n", errno);
    } else {
        xattrbuf[xattrlen]='\0';
        printf("xattr : %s\n", xattrbuf);
    }

    char buf[1024];
    ssize_t len = readlink(path, buf, 1023);
    if (len == -1) {
        printf("readlink errno : %d\n", errno);
    } else {
        buf[len]='\0';
        printf("symlink : %s\n", buf);
    }
    return 0;
}
