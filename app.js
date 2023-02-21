const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

/*app.get("/todos/", async (request, response) => {
  const requestQuery = `
    SELECT * FROM todo 
    ;`;
  const responseResult = await db.all(requestQuery);
  response.send(responseResult);
});*/

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

//API 1

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "" } = request.query;

  let getTodosQuery = "";
  let data = null;

  switch (true) {
    //scenario 1

    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT * FROM todo 
      WHERE 
      todo LIKE '%${search_q}%' 
      AND status = '${status}' 
      ;`;
      break;

    //scenario 2

    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT * FROM todo WHERE 
      todo LIKE '%${search_q}%' 
      AND
      priority = '${priority}'
      ;`;
      break;

    //scenario 3

    case hasStatusAndPriorityProperty(request.query):
      getTodosQuery = `
      SELECT * FROM todo WHERE 
      todo LIKE '%${search_q}%' AND
      status = '${status}' AND 
      priority = '${priority}'
      
      ;`;
      break;

    //scenario 4

    default:
      getTodosQuery = `
      SELECT * FROM todo WHERE 
      todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//AP1 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const idQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todoIdQuery = await db.get(idQuery);
  response.send(todoIdQuery);
});

//API 3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodo = `INSERT INTO todo(
        id,todo,priority,status
        )VALUES (
           '${id}','${todo}','${priority}','${status}' );`;
  await db.run(addTodo);
  response.send("Todo Successfully Added");
});

//API 4

app.put("/todos/:todoId/", async (request, response) => {
  const requestBody = request.body;
  const { todoId } = request.params;
  let updateColumn = "";

  switch (true) {
    //scenario1
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    //scenario2
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    //scenario3
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const getPreviousTodo = await db.get(previousTodoQuery);

  const {
    todo = getPreviousTodo.todo,
    priority = getPreviousTodo.priority,
    status = getPreviousTodo.status,
  } = request.body;

  const updateTodosQuery = `UPDATE todo SET todo = '${todo}',
  priority = '${priority}',
  status = '${status}' WHERE id = ${todoId};`;

  await db.run(updateTodosQuery);
  response.send(`${updateColumn} Updated`);
});

// API 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteQuery);

  response.send("Todo Deleted");
});

module.exports = app;
