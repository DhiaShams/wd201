const request = require("supertest");
 var cheerio = require("cheerio");
 const db = require("../models/index");
 const app = require("../app");
 
 let server, agent;
 const extractCsrfToken = (res) => {
   var $ = cheerio.load(res.text);
   return $("[name=_csrf]").val();
 };
 
 const login = async (agent, username, password) => {
   let res = await agent.get("/login");
   let csrfToken = extractCsrfToken(res);
   res = await agent.post("/session").send({
     email: username,
     password: password,
     _csrf: csrfToken,
   });
 };
 
 describe("Todo test suite", () => {
   beforeAll(async () => {
     await db.sequelize.sync({ force: true });
     server = app.listen(4000, () => {});
     agent = request.agent(server);
   });
   afterAll(async () => {
     await db.sequelize.close();
     server.close();
   });
 
   test("Sign up", async () => {
     let res = await agent.get("/signup");
     const csrfToken = extractCsrfToken(res);
     res = await agent.post("/users").send({
       firstName: "Test",
       lastName: "User A",
       email: "user.a@test.com",
       password: "12345678",
       _csrf: csrfToken,
     });
     expect(res.statusCode).toBe(302);
   });
 
   test("Sign out", async () => {
     let res = await agent.get("/todos");
     expect(res.statusCode).toBe(200);
     res = await agent.get("/signout");
     expect(res.statusCode).toBe(302);
     res = await agent.get("/todos");
     expect(res.statusCode).toBe(302);
   });
 
   test("creates a new todo at /todos", async () => {
     const agent = request.agent(server);
     await login(agent, "user.a@test.com", "12345678");
     const res = await agent.get("/todos");
     const csrfToken = extractCsrfToken(res);
     const response = await agent.post("/todos").send({
       title: "Buy Milk",
       dueDate: new Date().toISOString(),
       completed: false,
       _csrf: csrfToken,
     });
     expect(response.statusCode).toBe(302);
   });
 
   test("Mark a Todo as complete", async () => {
     const agent = request.agent(server);
     await login(agent, "user.a@test.com", "12345678");
 
     let res = await agent.get("/");
     let csrfToken = extractCsrfToken(res);
     await agent.post("/todos").send({
      title: "Buy Milk in store",
       dueDate: new Date().toISOString(),
       completed: false,
       _csrf: csrfToken,
     });
     const groupedTodoResponse = await agent
       .get("/todos")
       .set("Accept", "application/json");
     const parsedGroupedResponse = await JSON.parse(groupedTodoResponse.text);
     const dueTodayCount = parsedGroupedResponse.dueToday.length;
     const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
 
     res = await agent.get("/todos");
     csrfToken = extractCsrfToken(res);
 
     const markCompleteResponse = await agent
       .put(`/todos/${latestTodo.id}`)
       .send({
         _csrf: csrfToken,
         completed: true,
       });
     const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
     expect(parsedUpdateResponse.completed).toBe(true);
    });
  
    test("Mark a todo as incomplete", async () => {
      const agent = request.agent(server);
    
      // Login as a user
      let res = await agent.get("/signup");
      let csrfToken = extractCsrfToken(res);
    
      await agent.post("/users").send({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
        _csrf: csrfToken,
      });
    
      // Create a todo
      res = await agent.get("/todo");
      csrfToken = extractCsrfToken(res);
    
      await agent.post("/todos").send({
        title: "Buy milk",
        dueDate: new Date().toISOString(),
        completed: true,
        _csrf: csrfToken,
      });
    
      // Retrieve todos
      const groupedTodoResponse = await agent
        .get("/todo")
        .set("Accept", "application/json");
      const parsedGroupedResponse = JSON.parse(groupedTodoResponse.text);
    
      // Ensure there is at least one todo
      expect(parsedGroupedResponse.dueToday).toBeDefined();
      expect(parsedGroupedResponse.dueToday.length).toBeGreaterThan(0);
    
      const dueTodayCount = parsedGroupedResponse.dueToday.length;
      const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    
      // Mark the todo as incomplete
      res = await agent.get("/todo");
      csrfToken = extractCsrfToken(res);
    
      const markIncompleteResponse = await agent.put(`/todos/${latestTodo.id}`).send({
        _csrf: csrfToken,
        completed: false,
      });
    
      expect(markIncompleteResponse.statusCode).toBe(200);
    });
  
    test("Delete a todo", async () => {
      const agent = request.agent(server);
    
      // Login as a user
      let res = await agent.get("/signup");
      let csrfToken = extractCsrfToken(res);
    
      await agent.post("/users").send({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
        _csrf: csrfToken,
      });
    
      // Create a todo
      res = await agent.get("/todo");
      csrfToken = extractCsrfToken(res);
    
      await agent.post("/todos").send({
        title: "Buy milk",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,
      });
    
      // Retrieve todos
      const groupedTodoResponse = await agent
        .get("/todo")
        .set("Accept", "application/json");
      const parsedGroupedResponse = JSON.parse(groupedTodoResponse.text);
    
      // Ensure there is at least one todo
      expect(parsedGroupedResponse.dueToday).toBeDefined();
      expect(parsedGroupedResponse.dueToday.length).toBeGreaterThan(0);
    
      const dueTodayCount = parsedGroupedResponse.dueToday.length;
      const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    
      // Delete the todo
      res = await agent.get("/todo");
      csrfToken = extractCsrfToken(res);
    
      const deleteResponse = await agent.delete(`/todos/${latestTodo.id}`).send({
        _csrf: csrfToken,
      });
    
      expect(deleteResponse.statusCode).toBe(200);
    });
 });