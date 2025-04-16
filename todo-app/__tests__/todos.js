const request = require("supertest");
 var cheerio = require("cheerio");
 const db = require("../models/index");
 const app = require("../app");
 
 function extractCsrfToken(res) {
   var $ = cheerio.load(res.text);
   return $("[name=_csrf]").val();
 }
 
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
   test("Creating a todo ", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });
  test("updating a todo", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);

    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent.put(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(false);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    // FILL IN YOUR CODE HERE
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");

    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    console.log(latestTodo);
    const todoID = latestTodo.id;

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const deletedResponse = await agent.delete(`/todos/${todoID}`).send({
      _csrf: csrfToken,
    });
    const parsedDeleteResponse = JSON.parse(deletedResponse.text);
    expect(parsedDeleteResponse.success).toBe(true);
  });
});
