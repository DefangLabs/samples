package antispam

import (
	"fmt"
	"net"
)

func queryDomainBlockList(hostname string, dblserver string) net.IP {
	dblname := hostname + "." + dblserver
	return lookupIP(dblname)
}

// Check whether the host IP (the sender IP) is listed in the SBL.
func querySpamBlockList(ip net.IP, sblserver string, accessKey string) net.IP {
	ipaddr := ip.To4()
	var revip string
	if accessKey == "" {
		revip = fmt.Sprintf("%d.%d.%d.%d.%s", ipaddr[3], ipaddr[2], ipaddr[1], ipaddr[0], sblserver)
	} else {
		revip = fmt.Sprintf("%s.%d.%d.%d.%d.%s", accessKey, ipaddr[3], ipaddr[2], ipaddr[1], ipaddr[0], sblserver)
	}
	return lookupIP(revip)
}

// Returns whether the IP from SBL/DBL lookup identifies a spammer.
func isSpamIP(ip net.IP) bool {
	ipaddr := ip.To4()
	// 'nil' means the SBL/DBL lookup did not return any IP, i.e. not spam.
	// Chinese ISPs always return IPs for any DNS lookup, so we only consider 127.*.*.* spam.
	// MSB in last octet is used for error codes, so it should be 0 to be spam.
	return ipaddr != nil && ipaddr[0] == 127 && ipaddr[3] < 128
}

// / Return the first IP for the given host name or IP.
func tryGetHostAddress(hostOrIP string) net.IP {
	ip := net.ParseIP(hostOrIP)
	if ip != nil {
		return ip
	}
	return lookupIP(hostOrIP)
}

func lookupIP(hostname string) net.IP {
	addrs, err := net.LookupIP(hostname)
	if err != nil {
		return nil
	}
	return addrs[0]
}
