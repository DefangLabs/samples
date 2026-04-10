defmodule ChaosApi.Router do
  use Plug.Router

  plug :match
  plug Plug.Parsers, parsers: [:json], json_decoder: Jason
  plug :dispatch

  get "/api/health" do
    send_resp(conn, 200, Jason.encode!(%{status: "ok", service: "elixir-api"}))
  end

  get "/api/events" do
    events = ChaosApi.Repo.all(ChaosApi.Event)
    send_resp(conn, 200, Jason.encode!(events))
  end

  post "/api/events" do
    changeset = ChaosApi.Event.changeset(%ChaosApi.Event{}, conn.body_params)
    case ChaosApi.Repo.insert(changeset) do
      {:ok, event} ->
        ChaosApi.NatsPublisher.publish("events.created", Jason.encode!(event))
        send_resp(conn, 201, Jason.encode!(event))
      {:error, changeset} ->
        send_resp(conn, 422, Jason.encode!(%{errors: changeset.errors}))
    end
  end

  get "/api/stats" do
    count = ChaosApi.Repo.aggregate(ChaosApi.Event, :count, :id)
    send_resp(conn, 200, Jason.encode!(%{total_events: count}))
  end

  match _ do
    send_resp(conn, 404, Jason.encode!(%{error: "not found"}))
  end
end
