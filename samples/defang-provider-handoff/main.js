const AWS_TEMPLATE_URL =
  "https://s3.us-west-2.amazonaws.com/defang-public-readonly/defang-cd.yaml";
const GITHUB_OIDC_ISSUER = "token.actions.githubusercontent.com";
const AWS_CIROLE_NAME = "defang-cd-CIRole";

const REQUIRED_PARAMS = [
  "session",
  "org",
  "provider",
  "repoPattern",
  "refType",
  "refPattern",
];

const TOTAL_STEPS = 5;
let currentStep = 1;

function getParams() {
  return new URLSearchParams(window.location.search);
}

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
  document.getElementById("btn-back").hidden = n === 1;
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
  const params = getParams();
  const org = params.get("org");
  const repoPattern = params.get("repoPattern");
  const refType = params.get("refType");
  const refPattern = params.get("refPattern");
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
    const session = getParams().get("session");
    // TODO: replace this endpoint
    const res = await fetch("https://graphql.defang.io/completeCloudInvite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    if (!res.ok) {
      throw new Error("Request failed with status " + res.status);
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

document.addEventListener("DOMContentLoaded", function () {
  const error = document.getElementById("error");
  const params = getParams();
  const missing = REQUIRED_PARAMS.filter(function (key) {
    return !params.has(key);
  });

  if (missing.length > 0) {
    error.textContent =
      "Missing required query parameters: " + missing.join(", ");
    error.hidden = false;
    document.querySelector(".progress").hidden = true;
    document.querySelector(".actions").hidden = true;
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      document.getElementById("step-" + i).hidden = true;
    }
    return;
  }

  document.getElementById("btn-next").addEventListener("click", onNextClick);
  document.getElementById("btn-back").addEventListener("click", function () {
    if (currentStep > 1) showStep(currentStep - 1);
  });

  showStep(1);
});
