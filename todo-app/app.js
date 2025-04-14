const express = require("express");
var csrf = require("csurf");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");

app.use(bodyParser.urlencoded({ extended: false })); // to support form submissions
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(cookieParser("shh! some secret string"));
app.use(csrf({ cookie: true }));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Helper function to split todos
function categorizeTodos(todos) {
  const today = new Date().toISOString().split("T")[0];
  const overdue = [];
  const dueToday = [];
  const dueLater = [];

  todos.forEach((todo) => {
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

// Home Route
app.get("/", async (request, response) => {
  const todos = await Todo.getTodos();
  const { overdue, dueToday, dueLater } = categorizeTodos(todos);

  if (request.accepts("html")) {
    response.render("index", {
      overdueTodos: overdue,
      dueTodayTodos: dueToday,
      dueLaterTodos: dueLater,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      dueLaterCount: dueLater.length,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({ overdue, dueToday, dueLater }); // <-- fixed here
  }
});

// Get all todos as JSON
app.get("/todos", async function (_, response) {
  try {
    const todos = await Todo.findAll();
    response.send(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    response.status(500).json(error);
  }
});

// Get specific todo by id
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

// Add a new todo
app.post("/todos", async function (request, response) {
  try {
    await Todo.addTodo(request.body);
    return response.redirect("/"); // redirect back to the homepage after adding
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// Mark todo as completed
app.put("/todos/:id/markAsCompleted", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    if (!todo) {
      return response.status(404).send("Todo not found");
    }
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// Delete todo
app.delete("/todos/:id", async function (request, response) {
  try {
    const deletedResultsCount = await Todo.destroy({
      where: { id: request.params.id },
    });
    response.send(deletedResultsCount === 1);
  } catch (error) {
    console.log(error);
    response.status(500).json(error);
  }
});

module.exports = app;
