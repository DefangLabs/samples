defmodule ChaosApi.Repo do
  use Ecto.Repo,
    otp_app: :chaos_api,
    adapter: Ecto.Adapters.Postgres
end
