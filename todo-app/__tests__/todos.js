const supertest = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const { Todo } = require("../models");
const app = require("../app");

let agent;

// Extract CSRF token from the response
function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

// Date utility functions
const today = () => new Date().toISOString().split("T")[0];
const randomPastDate = () => new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0];
const randomFutureDate = () => new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0];

// Helper for creating todos directly in DB
const makeTodo = async ({ title, dueDate = null, completed = false }) => {
  return await Todo.create({
    title,
    dueDate: dueDate || today(),
    completed,
  });
};

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    agent = supertest.agent(app);
  });

  beforeEach(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it("Should create a sample due today item", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Sample Due Today",
      dueDate: today(),
      completed: false,
      _csrf: csrfToken,
    });

    expect(response.status).toBe(302);
    const created = await Todo.findOne({ where: { title: "Sample Due Today" } });
    expect(created).toBeDefined();
    expect(created.dueDate).toBe(today());
    expect(created.completed).toBe(false);
  });

  it("Should create a sample due later item", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Sample Due Later",
      dueDate: randomFutureDate(),
      completed: false,
      _csrf: csrfToken,
    });

    expect(response.status).toBe(302);
    const created = await Todo.findOne({ where: { title: "Sample Due Later" } });
    expect(created).toBeDefined();
    expect(created.dueDate).toBe(randomFutureDate());
    expect(created.completed).toBe(false);
  });

  it("Should create a sample overdue item", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Sample Overdue",
      dueDate: randomPastDate(),
      completed: false,
      _csrf: csrfToken,
    });

    expect(response.status).toBe(302);
    const created = await Todo.findOne({ where: { title: "Sample Overdue" } });
    expect(created).toBeDefined();
    expect(created.dueDate).toBe(randomPastDate());
    expect(created.completed).toBe(false);
  });

  it("Should mark a sample overdue item as completed", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);

    const todo = await makeTodo({
      title: "Sample Overdue",
      dueDate: randomPastDate(),
      completed: false,
    });

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const response = await agent.put(`/todos/${todo.id}`).send({
      completed: true,
      _csrf: csrfToken,
    });

    expect(response.status).toBe(200);
    await todo.reload();
    expect(todo.completed).toBe(true);
  });

  it("Should toggle a completed item to incomplete and back", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
  
    // Create todo via HTTP, not directly in DB
    const createResponse = await agent.post("/todos").send({
      title: "Sample Todo",
      dueDate: today(),
      completed: true,
      _csrf: csrfToken,
    });
    expect(createResponse.status).toBe(302);
  
    // Find the todo in DB
    const todo = await Todo.findOne({ where: { title: "Sample Todo" } });
    expect(todo).toBeDefined();
  
    // Refresh CSRF token
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
  
    // First toggle: mark incomplete
    let toggleResponse = await agent.put(`/todos/${todo.id}`).send({
      completed: false,
      _csrf: csrfToken,
    });
    expect(toggleResponse.status).toBe(200);
    await todo.reload();
    expect(todo.completed).toBe(false);
  
    // Refresh CSRF token again
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
  
    // Second toggle: mark complete again
    toggleResponse = await agent.put(`/todos/${todo.id}`).send({
      completed: true,
      _csrf: csrfToken,
    });
    expect(toggleResponse.status).toBe(200);
    await todo.reload();
    expect(todo.completed).toBe(true);
  });
  

  it("Returns all todos in JSON format", async () => {
    const todoList = await Promise.all([
      makeTodo({ title: "Turn on the light", dueDate: randomFutureDate(), completed: true }),
      makeTodo({ title: "Buy Clothes" }),
      makeTodo({ title: "Play piano", dueDate: randomPastDate() }),
      makeTodo({ title: "Goto gym", dueDate: randomFutureDate() }),
    ]);

    const response = await agent.get("/todos");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(4);

    todoList.forEach((todo) => {
      const found = response.body.find((item) => item.id === todo.id);
      expect(found).toBeDefined();
      expect(found.title).toBe(todo.title);
    });
  });

  it("Creates a new todo with CSRF token", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Goto Park",
      dueDate: randomPastDate(),
      _csrf: csrfToken,
    });

    expect(response.status).toBe(302);
    const created = await Todo.findOne({ order: [["id", "DESC"]] });
    expect(created).toMatchObject({
      title: "Goto Park",
      completed: false,
    });
  });

  it("Fails to create a new todo without CSRF token", async () => {
    const response = await agent.post("/todos").send({
      title: "Watch Movie",
      dueDate: randomFutureDate(),
    });
    expect([403, 500]).toContain(response.status);
  });

  it("Marks a todo as complete with CSRF token", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);

    const todo = await makeTodo({ title: "Buy Clothes" });
    const response = await agent.put(`/todos/${todo.id}`).send({
      completed: true,
      _csrf: csrfToken,
    });

    expect(response.status).toBe(200);
    await todo.reload();
    expect(todo.completed).toBe(true);
  });

  it("Fails to mark todo as complete without CSRF token", async () => {
    const todo = await makeTodo({ title: "Buy Clothes" });
    const response = await agent.put(`/todos/${todo.id}`).send({ completed: true });

    expect([403, 500]).toContain(response.status);
    await todo.reload();
    expect(todo.completed).toBe(false);
  });

  it("Marks a todo as incomplete with CSRF token", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);

    const todo = await makeTodo({ title: "Buy Clothes", completed: true });
    const response = await agent.put(`/todos/${todo.id}`).send({
      completed: false,
      _csrf: csrfToken,
    });

    expect(response.status).toBe(200);
    await todo.reload();
    expect(todo.completed).toBe(false);
  });

  it("Fails to mark todo as incomplete without CSRF token", async () => {
    const todo = await makeTodo({ title: "Buy Clothes", completed: true });
    const response = await agent.put(`/todos/${todo.id}`).send({ completed: false });

    expect([403, 500]).toContain(response.status);
    await todo.reload();
    expect(todo.completed).toBe(true);
  });

  it("Fails to delete a todo without CSRF token", async () => {
    const todo = await makeTodo({ title: "Buy Clothes" });
    const response = await agent.delete(`/todos/${todo.id}`).send();

    expect([403, 500]).toContain(response.status);
    await todo.reload();
    expect(todo.id).toBeDefined();
  });

  it("Toggles a todo's completion status", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);

    const todo = await makeTodo({ title: "Sample Todo", completed: false });

    let toggleResponse = await agent.put(`/todos/${todo.id}`).send({
      completed: true,
      _csrf: csrfToken,
    });

    expect(toggleResponse.status).toBe(200);
    expect(toggleResponse.body.completed).toBe(true);

    await todo.reload();
    expect(todo.completed).toBe(true);
  });
});
