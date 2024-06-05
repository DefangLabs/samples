import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => "Elysia × Defang")
  .listen({
    hostname: "0.0.0.0",
    port: 3000,
  });

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
