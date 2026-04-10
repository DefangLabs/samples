defmodule ChaosApi.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      ChaosApi.Repo,
      {Phoenix.PubSub, name: ChaosApi.PubSub},
      {Plug.Cowboy, scheme: :http, plug: ChaosApi.Router, options: [port: 4000]},
      {ChaosApi.NatsConsumer, []}
    ]

    opts = [strategy: :one_for_one, name: ChaosApi.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
