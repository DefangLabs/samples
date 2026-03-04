const AWS_TEMPLATE_URL =
  "https://s3.us-west-2.amazonaws.com/defang-public-readonly/defang-cd.yaml";
const GITHUB_OIDC_ISSUER = "token.actions.githubusercontent.com";
const AWS_CIROLE_NAME = "defang-cd-CIRole";

const DEFAULT_API_URL = "https://api.defang.io";

const TOTAL_STEPS = 5;
let currentStep = 1;

// Populated by fetchInvite() on page load.
let inviteData = null;

const inviteId = document.location.pathname.split("/").pop().trim();

function showStep(n) {
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    document.getElementById("step-" + i).hidden = i !== n;
    const stepEl = document.querySelector(
      ".progress-step[data-step='" + i + "']",
    );
    if (stepEl) {
      stepEl.classList.toggle("active", i === n);
      stepEl.classList.toggle("completed", i < n);
    }
  }
  const isSuccess = n === TOTAL_STEPS;
  document.getElementById("btn-back").hidden = n === 1 || isSuccess;
  document.getElementById("btn-next").hidden = isSuccess;
  document.getElementById("btn-next").textContent =
    n === 3 ? "Launch" : n === 4 ? "Confirm" : "Next";
  document.querySelector(".progress").hidden = isSuccess;
  document.querySelector(".actions").hidden = isSuccess;
  currentStep = n;
}

function onNextClick() {
  if (currentStep === 2) {
    const form = document.getElementById("provider-form");
    if (!form.reportValidity()) return;
    showStep(3);
  } else if (currentStep === 3) {
    const accountId = document.getElementById("account-id").value;
    const region = document.getElementById("region").value;
    onSubmit({ accountId, region });
    showStep(4);
  } else if (currentStep === 4) {
    onConfirm();
  } else {
    showStep(currentStep + 1);
  }
}

function onSubmit(properties) {
  const gitDetails = inviteData.gitDetails;
  const org = gitDetails.orgs?.[0] ?? "";
  const repoPattern = gitDetails.repoPattern ?? "*";
  const refType = gitDetails.refType ?? "all";
  const refPattern = gitDetails.refPattern ?? "*";
  const { accountId, region } = properties;
  const cloudformationURL = makeQuickCreateURL({
    accountId,
    region,
    org,
    refType,
    repoPattern,
    refPattern,
  });

  // open this URL in a new tab to avoid losing the query parameters (and thus state) of the current page
  window.open(cloudformationURL, "_blank");
  document.getElementById("cf-link").href = cloudformationURL;
}

async function onConfirm() {
  const confirmError = document.getElementById("confirm-error");
  confirmError.hidden = true;
  try {
    const apiUrl = DEFAULT_API_URL;
    const accountId = document.getElementById("account-id").value;
    const region = document.getElementById("region").value;

    const res = await fetch(`${apiUrl}/cloud-invites/${inviteId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",      },
      body: JSON.stringify({
        awsAccountId: accountId,
        awsRegion: region,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        data.message || "Request failed with status " + res.status,
      );
    }
    showStep(TOTAL_STEPS);
  } catch (err) {
    confirmError.textContent = err.message;
    confirmError.hidden = false;
  }
}

function makeQuickCreateURL({
  accountId,
  region,
  org,
  refType,
  repoPattern,
  refPattern,
}) {
  let oidcSubjects;
  if (refType === "all") {
    oidcSubjects = `repo:${org}/${repoPattern}:*`;
  } else if (refType === "branch") {
    oidcSubjects = `repo:${org}/${repoPattern}:ref:refs/heads/${refPattern}`;
  } else {
    oidcSubjects = `repo:${org}/${repoPattern}:environment:${refPattern}`;
  }
  const oidcAudiences = [
    `https://github.com/${org}`, // the default audience
    `sts.amazonaws.com`, // the audience set by the configure-aws-credentials GitHub action
  ];
  return makeCFStackCreateURL(AWS_TEMPLATE_URL, {
    accountId,
    region,
    stackName: "defang-cd", // NOTE: same name as in CLI, to avoid creating multiple buckets per region
    params: {
      CIRoleName: AWS_CIROLE_NAME, // fixed, so we can anticipate AWS_ROLE_ARN
      OidcProviderAudiences: oidcAudiences,
      OidcProviderIssuer: GITHUB_OIDC_ISSUER,
      OidcProviderSubjects: [oidcSubjects],
    },
  });
}

function makeCFStackCreateURL(templateURL, args) {
  const query = `region=${encodeURIComponent(args.region)}`;
  const fragmentParams = new URLSearchParams({
    templateURL,
  });
  if (args.stackName) {
    fragmentParams.set("stackName", args.stackName);
  }
  for (const [k, v] of Object.entries(args.params ?? {})) {
    fragmentParams.set(`param_${k}`, toString(v));
  }

  let baseUrl = `${args.region}.console.aws.amazon.com/cloudformation/home`;
  // Use account-specific URL if account ID is provided
  if (args.accountId) {
    baseUrl = `${args.accountId}.${baseUrl}`;
  }
  return `https://${baseUrl}?${query}#/stacks/create/review?${fragmentParams.toString()}`;
}

async function fetchInvite() {
  const apiUrl = DEFAULT_API_URL;

  const res = await fetch(`${apiUrl}/cloud-invites/${inviteId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      data.message || "This invite link is invalid or has expired.",
    );
  }
  return res.json();
}

document.addEventListener("DOMContentLoaded", async function () {
  const error = document.getElementById("error");
  const loading = document.getElementById("loading");

  if (inviteId === "") {
    error.textContent =
      "Missing required query parameters: " + missing.join(", ");
    error.hidden = false;
    loading.hidden = true;
    document.querySelector(".progress").hidden = true;
    document.querySelector(".actions").hidden = true;
    return;
  }

  try {
    inviteData = await fetchInvite();
    loading.hidden = true;
    showStep(1);
  } catch (err) {
    loading.hidden = true;
    error.textContent = err.message;
    error.hidden = false;
    document.querySelector(".progress").hidden = true;
    document.querySelector(".actions").hidden = true;
  }

  document.getElementById("btn-next").addEventListener("click", onNextClick);
  document.getElementById("btn-back").addEventListener("click", function () {
    if (currentStep > 1) showStep(currentStep - 1);
  });
});
