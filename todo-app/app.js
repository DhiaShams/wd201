const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");

app.use(bodyParser.urlencoded({ extended: false })); // to support form submissions
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long",["POST","PUT","DELETE"]));

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
  const completedTodos = todos.filter((todo) => todo.completed);

  if (request.accepts("html")) {
    response.render("index", {
      overdueTodos: overdue,
      dueTodayTodos: dueToday,
      dueLaterTodos: dueLater,
      completedTodos: completedTodos,  // <-- Add this
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      dueLaterCount: dueLater.length,
      completedCount: completedTodos.length,  // <-- And this
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({ 
      overdue, 
      dueToday, 
      dueLater, 
      completed: completedTodos  // <-- Add this too for JSON response consistency
    });
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
// app.put("/todos/:id", async (req, res) => {
//   const todo = await Todo.findByPk(req.params.id);
//   if (todo) {
//     todo.completed = req.body.completed;
//     await todo.save();
//     res.json(todo);
//   } else {
//     res.status(404).send();
//   }
// });
app.put("/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    todo.completed = req.body.completed === true || req.body.completed === "true";
    await todo.save();

    return res.status(200).json(todo); // Return the updated todo object
  } catch (error) {
    console.error("Error updating todo:", error);
    return res.status(500).json({ error: "Failed to update todo" });
  }
});

// Delete todo
app.delete("/todos/:id", async (req, res) => {
  try {
    await Todo.destroy({ where: { id: req.params.id } });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


module.exports = app;
