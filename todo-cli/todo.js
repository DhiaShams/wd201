const todoList = () => {
  let all = []; // Properly declare 'all' as a local variable

  const add = (todoItem) => {
    all.push(todoItem);
  };

  const markAsComplete = (index) => {
    if (index >= 0 && index < all.length) {
      all[index].completed = true;
    }
  };

  const formattedDate = (d) => d.toISOString().split("T")[0];

  const today = formattedDate(new Date());

  const overdue = () => {
    return all.filter((todo) => formattedDate(new Date(todo.dueDate)) < today);
  };

  const dueToday = () => {
    return all.filter((todo) => formattedDate(new Date(todo.dueDate)) === today);
  };

  const dueLater = () => {
    return all.filter((todo) => formattedDate(new Date(todo.dueDate)) > today);
  };

  const toDisplayableList = (list) => {
    return list
      .map((todo) => {
        const checkbox = todo.completed ? "[x]" : "[ ]";
        const dateDisplay =
          formattedDate(new Date(todo.dueDate)) === today
            ? ""
            : ` ${formattedDate(new Date(todo.dueDate))}`;
        return `${checkbox} ${todo.title}${dateDisplay}`;
      })
      .join("\n");
  };

  return {
    all,
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
    toDisplayableList,
  };
};

module.exports = todoList;
