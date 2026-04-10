defmodule ChaosApi.MixProject do
  use Mix.Project

  def project do
    [
      app: :chaos_api,
      version: "0.1.0",
      elixir: "~> 1.16",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      aliases: aliases()
    ]
  end

  def application do
    [
      extra_applications: [:logger],
      mod: {ChaosApi.Application, []}
    ]
  end

  defp deps do
    [
      {:phoenix, "~> 1.7"},
      {:phoenix_ecto, "~> 4.4"},
      {:ecto_sql, "~> 3.10"},
      {:postgrex, "~> 0.17"},
      {:jason, "~> 1.4"},
      {:plug_cowboy, "~> 2.7"},
      {:gnat, "~> 1.8"}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "ecto.create", "ecto.migrate"]
    ]
  end
end
