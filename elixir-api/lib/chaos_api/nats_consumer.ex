defmodule ChaosApi.NatsConsumer do
  use GenServer
  require Logger

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @impl true
  def init(state) do
    Process.send_after(self(), :connect, 1000)
    {:ok, state}
  end

  @impl true
  def handle_info(:connect, state) do
    nats_url = System.get_env("NATS_URL", "nats://nats:4222")
    case Gnat.start_link(%{host: nats_url}) do
      {:ok, conn} ->
        Gnat.sub(conn, self(), "events.>")
        Logger.info("Connected to NATS at #{nats_url}")
        {:noreply, Map.put(state, :conn, conn)}
      {:error, _reason} ->
        Logger.warning("NATS not ready, retrying in 5s...")
        Process.send_after(self(), :connect, 5000)
        {:noreply, state}
    end
  end

  def handle_info({:msg, %{body: body, topic: topic}}, state) do
    Logger.info("NATS message on #{topic}: #{body}")
    {:noreply, state}
  end
end

defmodule ChaosApi.NatsPublisher do
  require Logger

  def publish(subject, message) do
    nats_url = System.get_env("NATS_URL", "nats://nats:4222")
    case Gnat.start_link(%{host: nats_url}) do
      {:ok, conn} ->
        Gnat.pub(conn, subject, message)
        Gnat.stop(conn)
      {:error, reason} ->
        Logger.error("Failed to publish to NATS: #{inspect(reason)}")
    end
  end
end
