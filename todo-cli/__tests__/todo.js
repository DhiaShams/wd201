const todoList = require("../todo");

describe("Todolist Test Suite", () => {
  let todos; // Declare a local reference to the todo list

  beforeEach(() => {
    todos = todoList(); // Reinitialize todoList before each test
    todos.add({ title: "Test todo 1", completed: false, dueDate: formattedDate(new Date().setDate(new Date().getDate() - 1)) });
    todos.add({ title: "Test todo 2", completed: false, dueDate: formattedDate(new Date()) });
    todos.add({ title: "Test todo 3", completed: false, dueDate: formattedDate(new Date().setDate(new Date().getDate() + 1)) });
  });

  test("Should add new todo", () => {
    const todoItemsCount = todos.all.length;
    todos.add({
      title: "Test todo 4",
      completed: false,
      dueDate: formattedDate(new Date()) // Ensure date format consistency
    });
    expect(todos.all.length).toBe(todoItemsCount + 1);
    expect(todos.all[todoItemsCount].title).toBe("Test todo 4");
    expect(todos.all[todoItemsCount].completed).toBe(false);
  });

  test("Should mark a todo as complete", () => {
    expect(todos.all[0].completed).toBe(false);
    todos.markAsComplete(0);
    expect(todos.all[0].completed).toBe(true);
  });

  test("Should retrieve overdue items", () => {
    const overdueItems = todos.overdue();
    expect(overdueItems.every(todo => formattedDate(new Date(todo.dueDate)) < formattedDate(new Date()))).toBe(true);
  });

  test("Should retrieve due today items", () => {
    const dueTodayItems = todos.dueToday();
    expect(dueTodayItems.every(todo => formattedDate(new Date(todo.dueDate)) === formattedDate(new Date()))).toBe(true);
  });

  test("Should retrieve due later items", () => {
    const dueLaterItems = todos.dueLater();
    expect(dueLaterItems.every(todo => formattedDate(new Date(todo.dueDate)) > formattedDate(new Date()))).toBe(true);
  });
});

// Utility function to format date consistently
const formattedDate = (date) => {
  return new Date(date).toISOString().split("T")[0];
};

