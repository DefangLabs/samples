import os
from fastapi import FastAPI, Request, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
import asyncpg
from contextlib import asynccontextmanager
from pydantic import BaseModel
from databases import Database
from dotenv import load_dotenv

load_dotenv() 

database_url = os.getenv("DATABASE_URL")
print(f"Connecting to database at: {database_url}")
database = Database(database_url)


class TodoItem(BaseModel):
    id: int
    task: str
    completed: bool = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    conn = await asyncpg.connect(database_url)
    await conn.execute('''
            CREATE TABLE IF NOT EXISTS todos (
            id SERIAL PRIMARY KEY,
            task VARCHAR(255) NOT NULL,
            completed BOOLEAN DEFAULT FALSE
    );
    ''')
    await conn.close()
    yield
    await database.disconnect()

app = FastAPI(lifespan=lifespan)
templates = Jinja2Templates(directory="templates")


@app.get("/")
async def get_todos(request: Request):
    query = "SELECT * FROM todos"
    todos = await database.fetch_all(query)
    return templates.TemplateResponse("index.html", {"request": request, "todos": todos})

@app.post("/add")
async def create_todo(task: str = Form(...)):
    query = "INSERT INTO todos(task, completed) VALUES (:task, :completed)"
    values = {"task": task, "completed": False}
    await database.execute(query, values)
    return RedirectResponse(url="/", status_code=303)

@app.post("/delete/{todo_id}")
async def delete_todo(todo_id: int):
    query = "DELETE FROM todos WHERE id = :todo_id"
    await database.execute(query, {"todo_id": todo_id})
    return RedirectResponse(url="/", status_code=303)
