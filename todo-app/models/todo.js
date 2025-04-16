    "use strict";
 const { Model, Op } = require("sequelize");
 module.exports = (sequelize, DataTypes) => {
   class Todo extends Model {
     /**
      * Helper method for defining associations.
      * This method is not a part of Sequelize lifecycle.
      * The `models/index` file will call this method automatically.
      */
     static associate(models) {
       // define association here
     }
 
     static addTodo({ title, dueDate }) {
       return this.create({ title: title, dueDate: dueDate, completed: false });
     }
 
     static getTodos() {
      return this.findAll();
    }

    static async overdue() {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      const odt = await Todo.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date().toLocaleDateString("en-CA"),
          },
        },
      });
      return odt;
    }

    static async dueToday() {
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
      const dt = await Todo.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date().toLocaleDateString("en-CA"),
          },
        },
      });

      return dt;
    }

    static async dueLater() {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      const dl = await Todo.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date().toLocaleDateString("en-CA"),
          },
        },
      });
      return dl;
    }

    static async remove(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    setCompletionStatus(updatevalue) {
      return this.update({ completed: updatevalue });
    }

    static completedItems() {
      const compitems = this.findAll({
        where: {
          completed: true,
        },
      });
      return compitems;
    }

  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};