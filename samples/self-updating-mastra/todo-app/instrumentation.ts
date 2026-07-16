export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  void import("@/lib/db")
    .then(({ ensureSchema }) => ensureSchema())
    .catch((error) => {
      console.error("Could not initialize the database schema.", error);
    });
}
