'use strict';
const {
  Model
} = require('sequelize');
const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    static async addTask(params) {
      return await Todo.create(params);
    }

    static async markAsComplete(id) {
      const todo = await Todo.findByPk(id);
      if (todo) {
        todo.completed = true;
        await todo.save();
      }
    }

    static async overdue() {
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date().toISOString().split('T')[0]
          },
          completed: false
        },
        order: [['id', 'ASC']]
      });
    }

    static async dueToday() {
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date().toISOString().split('T')[0]
          },
        },
        order: [['id', 'ASC']]
      });
    }

    static async dueLater() {
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date().toISOString().split('T')[0]
          },
          completed: false
        },
        order: [['id', 'ASC']]
      });
    }

    static async showList() {
      console.log("My Todo list\n");

      console.log("Overdue");
      const overdueItems = await Todo.overdue();
      overdueItems.forEach(item => console.log(item.displayableString()));
      console.log("\n");

      console.log("Due Today");
      const todayItems = await Todo.dueToday();
      todayItems.forEach(item => console.log(item.displayableString()));
      console.log("\n");

      console.log("Due Later");
      const laterItems = await Todo.dueLater();
      laterItems.forEach(item => console.log(item.displayableString()));
    }

    displayableString() {
      const checkbox = this.completed ? "[x]" : "[ ]";
      const today = new Date().toISOString().split("T")[0];
      const displayDate = this.dueDate === today ? "" : ` ${this.dueDate}`;
      return `${this.id}. ${checkbox} ${this.title.trim()}${displayDate}`;
    }

    // eslint-disable-next-line no-unused-vars
    static associate(_models) {
      // define association here
    }
  }

  Todo.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Todo',
  });

  return Todo;
};
