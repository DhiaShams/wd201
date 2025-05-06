const express = require("express");
 const app = express();
 const bodyParser = require("body-parser");
 var cookieParser = require("cookie-parser");
 const path = require("path");
 var csrf = require("tiny-csrf");
 
 const passport = require("passport");
 const connectEnsureLogin = require("connect-ensure-login");
 const session = require("express-session");
 const flash = require("connect-flash");
 const LocalStrategy = require("passport-local");
 const bcrypt = require("bcrypt");
 
 const saltRounds = 10;
 
 //set ejs as view engine
 app.set("view engine", "ejs");
 
 app.use(bodyParser.json());
 app.use(express.urlencoded({ extended: false }));
 app.use(cookieParser("ssh! some secret string"));
 app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
 
 app.use(express.static(path.join(__dirname, "public")));
 app.set("views", path.join(__dirname, "views"));
 app.use(flash());
 
 app.use(
   session({
     secret: "my-super-secret-key-7643643789328",
     cookie: {
       maxAge: 24 * 60 * 60 * 1000,
     },
   })
 );
 
 app.use(passport.initialize());
 app.use(passport.session());
 
 app.use(function (request, response, next) {
   response.locals.messages = request.flash();
   next();
 });
 
 passport.use(
   new LocalStrategy(
     {
       usernameField: "email",
       passwordField: "password",
     },
     (username, password, done) => {
       User.findOne({ where: { email: username } })
         .then(async function (user) {
           const result = await bcrypt.compare(password, user.password);
           if (result) {
             return done(null, user);
           } else {
             return done(null, false, { message: "Invalid password" });
           }
         })
         .catch((error) => {
           return done(err);
         });
     }
   )
 );
 
 passport.serializeUser((user, done) => {
   console.log("Serializing user in session", user.id);
   done(null, user.id);
 });
 
 passport.deserializeUser((id, done) => {
   User.findByPk(id)
     .then((user) => {
       done(null, user);
     })
     .catch((error) => {
       done(error, null);
     });
 });
 
 const { Todo, User } = require("./models");
 
 app.get("/", async (request, response) => {
   response.render("index", {
     title: "Todo Application",
     csrfToken: request.csrfToken(),
   });
 });
 
 app.get(
   "/todo",
   connectEnsureLogin.ensureLoggedIn(),
   async (request, response) => {
     const loggedInUser = request.user.id;
     const UserName = request.user.firstName;
     const overdue = await Todo.overdue(loggedInUser);
     const dueToday = await Todo.dueToday(loggedInUser);
     const dueLater = await Todo.dueLater(loggedInUser);
     const completedItems = await Todo.completedItems(loggedInUser);
     if (request.accepts("html")) {
       response.render("todo", {
         overdue,
         dueToday,
         dueLater,
         completedItems,
         UserName,
         csrfToken: request.csrfToken(),
       });
     } else {
      response.json({ overdue, dueToday, dueLater, completedItems, UserName });
    }
  }
);

app.get("/signup", async (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  if (request.body.firstName.length == 0) {
    request.flash("error", "Please, Fill the First name!");
    return response.redirect("/signup");
  }
  if (request.body.email.length == 0) {
    request.flash("error", "Please, Fill the E-Mail!");
    return response.redirect("/signup");
  }
  if (request.body.password.length == 0) {
    request.flash("error", "Please, Fill the Password!");
    return response.redirect("/signup");
  }
  //Hash password using bcrypt
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  //Creating a user
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        res.redirect("/todo");
      } else {
        request.flash("success", "Sign up successful");
        response.redirect("/todo");
      }});
    } catch (error) {
      console.log(error);
      request.flash("error", "User already Exists");
      return response.redirect("/signup");
    }
  });
  
  app.get("/login", (request, response) => {
    response.render("login", { title: "Login", csrfToken: request.csrfToken() });
  });
  
  app.post(
    "/session",
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    function (request, response) {
      console.log(request.user);
      response.redirect("/todo");
    }
  );
  
  app.get("/signout", (request, response, next) => {
    request.logout((err) => {
      if (err) {
        return next(err);
      } response.redirect("/");
    });
  });
  
  app.get("/todos", async (_request, response) => {
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
  
  app.get("/todos/:id", async (request, response) => {
    try {
      const todo = await Todo.findByPk(request.params.id);
      return response.json(todo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  });
  
  app.post(
    "/todos",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      if (request.body.title.length == 0) {
        request.flash("error", "Please, Fill the title!");
        return response.redirect("/todo");
      }
      if (request.body.dueDate.length == 0) {
        request.flash("error", "Please, Fill the date!");
        return response.redirect("/todo");
      } else if (request.body.title.length < 5) {
        request.flash("error", "Title's length should be atleast 5 characters.");
        return response.redirect("/todo");
      }
      try {
        await Todo.addTodo({
          title: request.body.title,
          dueDate: request.body.dueDate,
          completed: false,
          userId: request.user.id,
        });
        return response.redirect("/todo");
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  );
  
  app.put(
    "/todos/:id",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      const todo = await Todo.findByPk(request.params.id);
      try {
        const updatedTodo = await todo.setCompletionStatus(
          request.body.completed
        );
        return response.json(updatedTodo);
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  );
  
  app.delete(
    "/todos/:id",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      console.log("Deleting a Todo with ID: ", request.params.id);
      try {
        await Todo.remove(request.params.id, request.user.id);
        return response.json({ success: true });
      } catch (error) {
        return response.status(422).json(error); }
      }
    );
    
    app.get("/todos", async (request, response) => {
      const todoItem = await Todo.gettodo();
      response.json(todoItem);
    });
    
    module.exports = app;