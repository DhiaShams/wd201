const express=require('express')
const app=express()
const {Todo}=require("./models")
const bodyParser=require('body-parser')
app.use(bodyParser.json())

app.get("/todos",(request,response)=>{
   // response.send("hello world")
   console.log("Todo list");
})

app.post("/todos",async(request,response)=>{
    console.log("Creating a todo",request.body)
    try{
        const todo=await Todo.addTodo({title:request.body.title,dueDate:request.body.dueDate,completed:false})
        return response.json(todo)
    }catch(error){
        console.log(error)
        return response.status(422).json(error)
    }
})

app.put("/todos/:id/markAsCompleted",async(request,response)=>{
    console.log("We have to update a todo with ID:",request.params.id)
    const todo=await Todo.findByPk(request.params.id)
    try{
        const updatedTodo=todo.markAsCompleted()
        return response.json(updatedTodo)
    }catch(error){
        console.log(error)
        return response.status(422).json(error)
    }
})

app.delete("/todos/:id",(request,response)=>{
    console.log("Delete a todo by ID:",request.params.id)
})

app.listen(3000,()=>{
    console.log("Started express server at port 3000")
})