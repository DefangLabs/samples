package antispam

// Check whether the domain (the link) is listed in the DBL.
func CheckDomainBlockList(hostname string, dblserver string) bool {
	return isSpamIP(queryDomainBlockList(hostname, dblserver))
}

// Check whether the host (the sender) is listed in the SBL.
func CheckSpamBlockList(hostOrIP string, sblserver string, accessKey string) bool {
	// TODO: check first IP only?
	hostIP := tryGetHostAddress(hostOrIP)

	// Assume it's spam when the host lookup fails
	if hostIP == nil {
		return true
	}
	return isSpamIP(querySpamBlockList(hostIP, sblserver, accessKey))
}
