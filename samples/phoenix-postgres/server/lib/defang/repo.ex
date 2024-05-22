defmodule Defang.Repo do
  use Ecto.Repo,
    otp_app: :defang,
    adapter: Ecto.Adapters.Postgres
end
