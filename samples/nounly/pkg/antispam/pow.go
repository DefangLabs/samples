package antispam

import (
	"crypto/sha256"
	"math/bits"
)

func CheckProofOfWork(str []byte, difficultyBits int) bool {
	hash := sha256.Sum256(str)
	return leadingZeros(hash[:]) >= difficultyBits
}

func leadingZeros(ar []byte) (zeros int) {
	for _, b := range ar {
		if b != 0 {
			zeros += bits.LeadingZeros8(b)
			break
		}
		zeros += 8
	}
	return
}
