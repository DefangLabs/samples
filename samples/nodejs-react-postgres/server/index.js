const express = require('express');
const app = express()
const cors = require("cors");
const pool = require("./db")

app.use(cors());
app.use(express.json())

const createData = `CREATE TABLE IF NOT EXISTS todo(
  todo_id SERIAL PRIMARY KEY,
  description VARCHAR(255)
)`

pool.query(createData)


//Routes
app.post("/todos", async (req, res) => {
    try {
        const { description } = req.body;
        const newTodo = await pool.query(
            "INSERT INTO todo (description) VALUES($1) RETURNING *", [description]
        );

        res.json(newTodo.rows[0])
    } catch (error) {
        console.error(error.message)
        
    }
})

app.get("/todos", async (req, res) => {
    try {
      const allTodos = await pool.query("SELECT * FROM todo");
      res.json(allTodos.rows);
    } catch (error) {
      console.error(error.message);
    }
});

app.get("/todos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const todo = await pool.query("SELECT * FROM todo WHERE todo_id = $1", [
        id
      ]);
  
      res.json(todo.rows[0]);
    } catch (error) {
      console.error(err.message);
    }
});



app.put("/todos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { description } = req.body;
      const updateTodo = await pool.query(
        "UPDATE todo SET description = $1 WHERE todo_id = $2",
        [description, id]
      );
  
      res.json("Todo was updated!");
    } catch (error) {
      console.error(err.message);
    }
});

app.delete("/todos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleteTodo = await pool.query("DELETE FROM todo WHERE todo_id = $1", [
        id
      ]);
      res.json("Todo was deleted!");
    } catch (error) {
      console.log(error.message);
    }
});

app.listen(3010, () => {
    console.log("server has started on port")
})