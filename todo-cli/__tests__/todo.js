const todoList = require("../todo");

const { all, markAsComplete, add, overdue, dueToday, dueLater } = todoList();

const formattedDate = (d) => d.toISOString().split("T")[0];

var dateToday = new Date();
const today = formattedDate(dateToday);
const yesterday = formattedDate(
  new Date(new Date().setDate(dateToday.getDate() - 1))
);
const tomorrow = formattedDate(
  new Date(new Date().setDate(dateToday.getDate() + 1))
);

describe("Todolist Test Suite", () => {
  beforeEach(() => {
    // Reset all before each test
    all.length = 0;
    add({ title: "Test todo 1", completed: false, dueDate: yesterday });
    add({ title: "Test todo 2", completed: false, dueDate: today });
    add({ title: "Test todo 3", completed: false, dueDate: tomorrow });
  });

  test("Should add new todo", ()=>{
    const todoItemsCount=all.length;
    add(
        {
            title:"Test todo",
            completed:false,
            dueDate: new Date().toISOString()
        }
    );
    expect(all.length).toBe(todoItemsCount+1);
});

test("Should mark a todo as complete", ()=>{
    expect(all[0].completed).toBe(false);
    markAsComplete(0);
    expect(all[0].completed).toBe(true);
})

  test("Should retrieve overdue items", () => {
    const overdueItems = overdue();
    expect(overdueItems.every((todo) => formattedDate(new Date(todo.dueDate)) < today)).toBe(true);
  });

  test("Should retrieve due today items", () => {
    const dueTodayItems = dueToday();
    expect(dueTodayItems.every((todo) => formattedDate(new Date(todo.dueDate)) === today)).toBe(true);
  });

  test("Should retrieve due later items", () => {
    const dueLaterItems = dueLater();
    expect(dueLaterItems.every((todo) => formattedDate(new Date(todo.dueDate)) > today)).toBe(true);
  });
});
