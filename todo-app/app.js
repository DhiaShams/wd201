const express = require("express");
 const app = express();
 var csrf = require("tiny-csrf");
 var cookieParser = require("cookie-parser");
 const { Todo } = require("./models");
 const bodyParser = require("body-parser");
 const path = require("path");
 app.use(bodyParser.json());
 app.use(express.urlencoded({ extended: false }));
 app.use(cookieParser("ssh! some secret string"));
 app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
 
 
 //set ejs as view engine
 app.set("view engine", "ejs");
 app.use(express.static(path.join(__dirname, "public")));
 
 app.get("/", async (request, response) => {
   const overdue = await Todo.overdue();
   const dueToday = await Todo.dueToday();
   const dueLater = await Todo.dueLater();
   const completedItems = await Todo.completedItems();
   if (request.accepts("html")) {
    response.render("index", { overdue, dueToday, dueLater,completedItems, csrfToken: request.csrfToken()});
  } else {    response.json({ overdue, dueToday, dueLater, completedItems });
}
});

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE

  try {
    const todos = await Todo.findAll();
    return response.send(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    await Todo.addTodo(request.body);
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("Deleting a Todo with ID: ", request.params.id);
  try {
    await Todo.remove(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    return response.status(422).json(error);
  }
});

app.get("/todos", async (request, response) => {
  const todoItem = await Todo.gettodo();
  response.json(todoItem);
});

module.exports = app;