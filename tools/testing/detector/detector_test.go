package detector

import (
	"strings"
	"testing"
)

func TestStringDetector(t *testing.T) {
	found := false
	detector := &StringDetector{
		Target:   "some long string",
		Callback: func() { found = true },
	}

	foundData := []string{
		"prefix ", "and some new line\n",
		"then some prefix ", " and the first half some lo", "ng string and the second half\n",
		"and some suffix",
	}
	for _, data := range foundData {
		detector.Write([]byte(data))
	}
	if !found {
		t.Error("expected callback to be called")
	}

	found = false
	notFoundData := []string{
		"prefix ", "and some new line\n",
		"then some prefix ", " and the first half some lo\n",
		"ng string and the second half\n",
		"and some suffix",
	}
	for _, data := range notFoundData {
		detector.Write([]byte(data))
	}
	if found {
		t.Error("expected callback not to be called")
	}

	found = false
	realLog := []string{
		"2024-06-25T13:47:08.037362-07:00 app-image kaniko INFO[0025] No files changed in this command, skipping snapshotting.\n",
		"2024-06-25T13:47:09.183664-07:00 app-image kaniko WARN[0026] Error uploading layer to cache: failed to push to destination 426819183542.dkr.ecr.us-west-2.amazonaws.com/kaniko-build/cache:bfe5415d1c29c2b46c05e102d2597ba7bf044b78324c80e7a698622cdf21b312: POST https://426819183542.dkr.ecr.us-west-2.amazonaws.com/v2/kaniko-build/cache/blobs/uploads/: NAME_UNKNOWN: The repository with name 'kaniko-build/cache' does not exist in the registry with id '426819183542'\n",
		"2024-06-25T13:47:10.032389-07:00 app-image kaniko INFO[0027] Pushing image to 426819183542.dkr.ecr.us-west-2.amazonaws.com/kaniko-build:app-image-83423828-x86_64\n",
		"2024-06-25T13:47:10.732675-07:00 app-image kaniko INFO[0028] Pushed 426819183542.dkr.ecr.us-west-2.amazonaws.com/kaniko-build@sha256:b1eeda86919b5a0ed62a84565e47856592342e70ad376804b739110f45947f84\n",
		"2024-06-25T13:47:26.989057-07:00 cd pulumi Update succeeded in 2m47.684829371s ; provisioning...\n",
		"2024-06-25T13:47:44.061945-07:00 app fabric status=TASK_PROVISIONING\n",
		"2024-06-25T13:47:46.134366-07:00 app fabric status=TASK_PENDING\n",
		"2024-06-25T13:47:46.803604-07:00 app fabric status=TASK_PENDING\n",
		"2024-06-25T13:47:56.906058-07:00 app fabric status=TASK_ACTIVATING\n",
		"2024-06-25T13:48:05.910161-07:00 app fabric status=TASK_RUNNING\n",
		" ! Reconnecting...\r ! failed to wait for service status: service state monitoring terminated without all services reaching desired state: COMPLETED\n",
		"                  \r ! Reconnecting...\r                  \r * Service app is in state BUILD_QUEUED and will be available at:\n",
		"   - https://defangsampletestfaketenant3-app--8080.staging.defang.dev\n",
		" * Done.\n",
	}
	detector.Target = "! failed to wait for service status:"
	for _, data := range realLog {
		for _, char := range []byte(data) {
			detector.Write([]byte{char})
		}
	}
	if !found {
		t.Error("expected callback to be called for real log")
	}

	found = false
	detector.Write([]byte(strings.Join(realLog, "")))
	if !found {
		t.Error("expected callback to be called for real log in a single write")
	}

}
