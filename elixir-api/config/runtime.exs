import Config

config :chaos_api, ChaosApi.Repo,
  hostname: System.get_env("DATABASE_HOST", "cockroachdb"),
  port: String.to_integer(System.get_env("DATABASE_PORT", "26257")),
  username: System.get_env("DATABASE_USER", "root"),
  password: System.get_env("DATABASE_PASSWORD", ""),
  database: System.get_env("DATABASE_NAME", "chaos_events")
