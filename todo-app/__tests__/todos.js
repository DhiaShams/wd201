const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
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

  test("Marks a todo with the given ID as complete", async () => {
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

    const markCompleteResponse = await agent
  .put(`/todos/${latestTodo.id}`)
  .send({
    completed: true,
    _csrf: csrfToken,
  });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Test delete",
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

    const deleteResponse = await agent
      .delete(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
      });
    expect(deleteResponse.text).toBe("true");
  });

  test("Contains one element with the given IDs in each section to show the count of todos", async () => {
    const res = await agent.get("/").set("Accept", "application/json");
    const parsedResponse = JSON.parse(res.text);

    expect(parsedResponse.overdue).toBeDefined();
    expect(parsedResponse.dueToday).toBeDefined();
    expect(parsedResponse.dueLater).toBeDefined();
    expect(parsedResponse.completed).toBeDefined();
  });

  test("Creates a sample due today item", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Sample Due Today",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    expect(response.statusCode).toBe(302);
  });

  test("Creates a sample due later item", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Sample Due Later",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    expect(response.statusCode).toBe(302);
  });

  test("Creates a sample overdue item", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Sample Overdue",
      dueDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    expect(response.statusCode).toBe(302);
  });

  test("Marks a sample overdue item as completed", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);

    await agent.post("/todos").send({
      title: "Sample Overdue",
      dueDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const overdueTodo = parsedGroupedResponse.overdue[0];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent
      .put(`/todos/${overdueTodo.id}`)
      .send({
        completed: true,
        _csrf: csrfToken,
      });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test("Toggles a completed item to incomplete when clicked on it", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);

    await agent.post("/todos").send({
      title: "Sample Toggle",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const completedTodo = parsedGroupedResponse.completed[0];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const toggleResponse = await agent
      .put(`/todos/${completedTodo.id}`)
      .send({
        completed: false,
        _csrf: csrfToken,
      });

    const parsedToggleResponse = JSON.parse(toggleResponse.text);
    expect(parsedToggleResponse.completed).toBe(false);
  });
});
