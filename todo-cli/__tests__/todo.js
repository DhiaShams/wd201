const todoList = require("../todo");

describe("TodoList Test Suite", () => {
  let todos; // Declare a new instance of todoList
  
  beforeEach(() => {
    todos = todoList(); // Reinitialize the todo list before each test
  });

  const addTodo = ({ title = "new todo", completed = false, dueDate = null } = {}) => {
    todos.add({
      title,
      completed,
      dueDate: dueDate ?? new Date().toISOString().slice(0, 10),
    });
  };

  test("should add new todo", () => {
    const todoItemsCount = todos.all.length;
    addTodo();
    expect(todos.all.length).toBe(todoItemsCount + 1);
  });

  test("should mark todo as complete", () => {
    addTodo({ completed: false });
    expect(todos.all[0].completed).toBe(false);
    todos.markAsComplete(0);
    expect(todos.all[0].completed).toBe(true);
  });

  test("should return overdue items", () => {
    addTodo();
    addTodo({
      dueDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10),
    });
    expect(todos.all.length).toBe(2);
    expect(todos.overdue().length).toBe(1);
  });

  test("should return due today items", () => {
    addTodo({
      dueDate: new Date().toISOString().slice(0, 10),
    });
    expect(todos.dueToday().length).toBe(1);
  });

  test("should return due later", () => {
    addTodo({
      dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10),
    });
    expect(todos.dueLater().length).toBe(1);
  });
});
