"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The models/index file will call this method automatically.
     */

    static async addTodo({ title, dueDate }) {
      return await this.create({ title, dueDate, completed: false });
    }

    static async getTodos() {
      return await this.findAll();
    }

    static async remove(id) {
      return await this.destroy({
        where: { id }
      });
    }

    async markAsCompleted() {
      return await this.update({ completed: true });
    }

    static async overdue() {
      return await this.findAll({
        where: {
          dueDate: { [sequelize.Sequelize.Op.lt]: new Date() },
          completed: false
        },
        order: [["dueDate", "ASC"]]
      });
    }

    static async dueToday() {
      const today = new Date().toISOString().split("T")[0];
      return await this.findAll({
        where: {
          dueDate: today,
          completed: false
        },
        order: [["id", "ASC"]]
      });
    }

    static async dueLater() {
      return await this.findAll({
        where: {
          dueDate: { [sequelize.Sequelize.Op.gt]: new Date() },
          completed: false
        },
        order: [["dueDate", "ASC"]]
      });
    }
  }

  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: "Todo"
    }
  );

  return Todo;
};