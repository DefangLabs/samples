defmodule ChaosApi.Repo.Migrations.CreateEvents do
  use Ecto.Migration

  def change do
    create table(:events) do
      add :type, :string, null: false
      add :payload, :map, default: %{}
      add :source, :string, null: false
      timestamps()
    end

    create index(:events, [:type])
    create index(:events, [:source])
  end
end
