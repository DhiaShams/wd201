const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");

app.use(bodyParser.urlencoded({ extended: false }));  // to support form submissions
app.use(bodyParser.json());  // to support JSON-encoded bodies

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

function categorizeTodos(todos) {
  const today = new Date().toISOString().split("T")[0];
  const overdue = [];
  const dueToday = [];
  const dueLater = [];

  todos.forEach(todo => {
    if (todo.dueDate < today) {
      overdue.push(todo);
    } else if (todo.dueDate === today) {
      dueToday.push(todo);
    } else {
      dueLater.push(todo);
    }
  });

  return { overdue, dueToday, dueLater };
}

app.get("/", async (request, response) => {
  const todos = await Todo.getTodos();
  const { overdue, dueToday, dueLater } = categorizeTodos(todos);

  if (request.accepts("html")) {
    response.render("index", { overdue, dueToday, dueLater });
  } else {
    response.json(todos);
  }
});

app.get("/todos", async function (_, response) {
  const todos = await Todo.findAll();
  response.send(todos);
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    if (todo) {
      return response.json(todo);
    }
    return response.status(404).send();
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    const todo = await Todo.addTodo(request.body);
    return response.redirect("/");  // redirect back to the homepage after adding
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  const deletedResultsCount = await Todo.destroy({
    where: { id: request.params.id },
  });
  response.send(deletedResultsCount === 1);
});

module.exports = app;
