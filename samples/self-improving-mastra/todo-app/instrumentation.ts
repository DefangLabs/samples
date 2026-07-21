export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  void import("@/lib/db")
    .then(({ ensureSchema }) => ensureSchema())
    .catch((error) => {
      console.error("Could not initialize the database schema.", error);
    });
}

// Capture server-side errors (rendering, route handlers, server actions) into
// the feedback backlog so the admin can dispatch the coding agent to fix them.
export async function onRequestError(
  error: unknown,
  request: { path?: string },
  context: { routePath?: string },
) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { recordError } = await import("@/lib/report-error");
    const detail = error instanceof Error ? error.stack ?? error.message : String(error);
    const where = request?.path ?? context?.routePath ?? "the app";
    await recordError(`Server error at ${where}: ${detail.split("\n")[0]}`, detail.slice(0, 1500));
  } catch (err) {
    console.error("Could not capture server error.", err);
  }
}
