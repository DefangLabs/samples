defmodule ChaosApi.Event do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :type, :payload, :source, :inserted_at]}
  schema "events" do
    field :type, :string
    field :payload, :map
    field :source, :string
    timestamps()
  end

  def changeset(event, attrs) do
    event
    |> cast(attrs, [:type, :payload, :source])
    |> validate_required([:type, :source])
  end
end
