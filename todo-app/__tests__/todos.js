const request = require("supertest");
 var cheerio = require("cheerio");
 const db = require("../models/index");
 const app = require("../app");
 
 function extractCsrfToken(res) {
   var $ = cheerio.load(res.text);
   return $("[name=_csrf]").val();
 }
 
 const login = async (agent, username, password) => {
   let res = await agent.get("/login");
   let csrfToken = extractCsrfToken(res);
   res = await agent.post("/session").send({
     email: username,
     password: password,
     _csrf: csrfToken,
   });
 };
 
 let server, agent;
 
 describe("Todo Application", function () {
   beforeAll(async () => {
     await db.sequelize.sync({ force: true });
     server = app.listen(4000, () => {});
     agent = request.agent(server);
   });
 
   afterAll(async () => {
     try {
       await db.sequelize.close();
       await server.close();
     } catch (error) {
       console.log(error);
     }
   });
 
   test("Signup", async () => {
     let res = await agent.get("/signup");
     const csrfToken = extractCsrfToken(res);
     res = await agent.post("/users").send({
       firstName: "Test",
       lastName: "User A",
       email: "userA@gmail.com",
       password: "12345678",
       _csrf: csrfToken,
     });
     expect(res.statusCode).toBe(302);
   });
 
   test("Sign out", async () => {
     let res = await agent.get("/todo");
     expect(res.statusCode).toBe(200);
     res = await agent.get("/signout");
     expect(res.statusCode).toBe(302);
     res = await agent.get("/todo");
     expect(res.statusCode).toBe(302);
   });
 
   test("Creating a todo ", async () => {
     const agent = request.agent(server);
     await login(agent, "userA@gmail.com", "12345678");
     const res = await agent.get("/todo");
     const csrfToken = extractCsrfToken(res);
     const response = await agent.post("/todos").send({
       title: "Buy milk",
       dueDate: new Date().toISOString(),
       completed: false,
       _csrf: csrfToken,
     });
     expect(response.statusCode).toBe(302);
   });
 
   test("marking as complete", async () => {
     const agent = request.agent(server);
     await login(agent, "userA@gmail.com", "12345678");
     let res = await agent.get("/todo");
     let csrfToken = extractCsrfToken(res);
     await agent.post("/todos").send({
       title: "buy milk",
       dueDate: new Date().toISOString(),
       completed: false,
       _csrf: csrfToken,
     });
     const groupedTodosResponse = await agent
       .get("/todo")
       .set("Accept", "application/json");
 
     const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
     const dueTodayCount = parsedGroupedResponse.dueToday.length;
     const newTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
 
     res = await agent.get("/todo");
     csrfToken = extractCsrfToken(res);
 
     const markCompleteResponse = await agent.put(`/todos/${newTodo.id}`).send({
       _csrf: csrfToken,
       completed: true,
     });
     const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
     expect(parsedUpdateResponse.completed).toBe(true);
   });
 
   test("marking as incomplete", async () => {
     const agent = request.agent(server);
     await login(agent, "userA@gmail.com", "12345678");
     let res = await agent.get("/todo");
     let csrfToken = extractCsrfToken(res);
     await agent.post("/todos").send({
       title: "Buy milk",
       dueDate: new Date().toISOString(),
       completed: true,
       _csrf: csrfToken,
     });
     const groupedTodos = await agent
       .get("/todo")
       .set("Accept", "application/json");
 
     const parsedGroupedResponse = JSON.parse(groupedTodos.text);
     const dueTodayCount = parsedGroupedResponse.dueToday.length;
     const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
 
     res = await agent.get("/todo");
     csrfToken = extractCsrfToken(res);
 
     const markCompleteResponse = await agent
       .put(`/todos/${latestTodo.id}`)
       .send({
         _csrf: csrfToken,
         completed: false,
       });
     const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
     expect(parsedUpdateResponse.completed).toBe(false);
   });
 
   test("Deleting a todo", async () => {
     const agent = request.agent(server);
     await login(agent, "userA@gmail.com", "12345678");
     let res = await agent.get("/todo");
     let csrfToken = extractCsrfToken(res);
     await agent.post("/todos").send({
       title: "Buy milk",
       dueDate: new Date().toISOString(),
       completed: false,
       _csrf: csrfToken,
     });
 
     const groupedTodosResponse = await agent
       .get("/todo")
       .set("Accept", "application/json");
 
     const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
     const dueTodayCount = parsedGroupedResponse.dueToday.length;
     const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
 
     res = await agent.get("/todo");
     csrfToken = extractCsrfToken(res);
 
     const deletedResponse = await agent.delete(`/todos/${latestTodo.id}`).send({
       _csrf: csrfToken,
     });
     const parsedDeleteResponse = JSON.parse(deletedResponse.text);
     expect(parsedDeleteResponse.success).toBe(true);
   });
 
   test("userA cannot modify userB's todo", async () => {
     const agent = request.agent(server);
 
     let res = await agent.get("/signup");
     let csrfToken = extractCsrfToken(res);
 
     await agent.post("/users").send({
       firstName: "userA",
       lastName: "test",
       email: "userA@gmail.com",
       password: "12345678",
       _csrf: csrfToken,
     });
 
     let res1 = await agent.get("/todo");
     csrfToken = extractCsrfToken(res1);
 
     await agent.post("/todos").send({
       title: "Buy milk",
       dueDate: new Date().toISOString(),
       completed: false,
       _csrf: csrfToken,
     });
 
     const groupedTodosResponse = await agent
       .get("/todo")
       .set("Accept", "application/json");
     const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
     const dueTodayCount = parsedGroupedResponse.dueToday.length;
     const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
 
     await agent.get("/signout");
 
     let res2 = await agent.get("/signup");
     csrfToken = extractCsrfToken(res2);
 
     await agent.post("/users").send({
       firstName: "userB",
       lastName: "test",
       email: "userB@gmail.com",
       password: "87654321",
       _csrf: csrfToken,
     });
 
     let res3 = await agent.get("/todo");
     csrfToken = extractCsrfToken(res3);
 
     const markCompleteResponse = await agent
       .put(`/todos/${latestTodo.id}`)
       .send({
         _csrf: csrfToken,
       });
 
     const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
     expect(parsedUpdateResponse.completed).toBe(false);
   });
 
   test("userA cannot delete userB's todo", async () => {
     let res = await agent.get("/signup");
     let csrfToken = extractCsrfToken(res);
 
     res = await agent.post("/users").send({
       firstName: "userA",
       lastName: "test",
       email: "userA@gmail.com",
       password: "12345678",
       _csrf: csrfToken,
     });
 
     res = await agent.get("/todo");
     csrfToken = extractCsrfToken(res);
     res = await agent.post("/todos").send({
       title: "Buy milk",
       dueDate: new Date().toISOString(),
       completed: false,
       _csrf: csrfToken,
     });
     const userid = res.id;
 
     await agent.get("/signout");
 
     res = await agent.get("/signup");
     csrfToken = extractCsrfToken(res);
     res = await agent.post("/users").send({
       firstName: "userB",
       lastName: "test",
       email: "userB@gmail.com",
       password: "1234567890",
       _csrf: csrfToken,
     });
 
     res = await agent.get("/todo");
     csrfToken = extractCsrfToken(res);
     const deleteResponse = await agent.delete(`/todos/${userid}`).send({
       _csrf: csrfToken,
     });
     expect(deleteResponse.statusCode).toBe(422);
   });
 });