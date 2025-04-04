const todoList = () => {
    all = []
    const add = (todoItem) => {
      all.push(todoItem)
    }
    const markAsComplete = (index) => {
      all[index].completed = true
    }
  
    const overdue = () => {
      return all.filter(todo => todo.dueDate < today);
    }
  
    const dueToday = () => {
        return all.filter(todo => todo.dueDate === today);
    }
  
    const dueLater = () => {
        return all.filter(todo => todo.dueDate > today);
    }
  
    const toDisplayableList = (list) => {
      return list.map(todo=>{
        const checkbox = todo.completed?"[x]" : "[ ]";
        const dateDisplay =todo.dueDate=== today?"":`${todo.dueDate}`;
        return `${checkbox} ${todo.title} ${dateDisplay}`;
      }).join("\n");
    };
  
    return {
      all,
      add,
      markAsComplete,
      overdue,
      dueToday,
      dueLater,
      toDisplayableList
    };
  };
  
  module.exports=todoList;