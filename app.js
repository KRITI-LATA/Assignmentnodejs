const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");

const isMatch = require("date-fns/isMatch");

const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializerDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializerDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const convertDBObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

//API - 1

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category, dueDate } = request.query;

  let data = null;
  let getTodoQuery = "";

  //We are using switch case for different scenarios

  switch (true) {
    // Scenario 1 -- has only status

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `select * from todo where status = '${status}';`;
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertDBObjectToResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //Scenarios 2 only priority

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `select * from todo where priority = '${priority}';`;
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertDBObjectToResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Returns a list of all todos whose priority is 'HIGH' and status is 'IN PROGRESS'
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `select * from todo where priority = '${priority}' and status = '${status}';`;
          data = await db.all(getTodoQuery);
          response.send(
            data.map((eachItem) => convertDBObjectToResponseObject(eachItem))
          );
        } else {
          response.status(400);
          response.send("'Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Returns a list of all todos whose todo contains 'Buy' text

    case hasSearchProperty(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      response.send(
        data.map((eachItem) => convertDBObjectToResponseObject(eachItem))
      );
      break;

    //Returns a list of all todos whose category is 'WORK' and status is 'DONE'
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `select * from todo where category = '${category}' and status = '${status}';`;
          data = await db.all(getTodoQuery);
          response.send(
            data.map((eachItem) => convertDBObjectToResponseObject(eachItem))
          );
        } else {
          response.status(400);
          response.send("'Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Returns a list of all todos whose category is 'HOME'

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `select * from todo where category = '${category}';`;
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertDBObjectToResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Returns a list of all todos whose category is 'LEARNING' and priority is 'HIGH'
    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `select * from todo where category = '${category}' and priority = '${priority}';`;
          data = await db.all(getTodoQuery);
          response.send(
            data.map((eachItem) => convertDBObjectToResponseObject(eachItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    default:
      getTodoQuery = `select * from todo;`;
      data = await db.all(getTodoQuery);
      response.send(
        data.map((eachItem) => convertDBObjectToResponseObject(eachItem))
      );
  }
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const specificTodoquery = `select * from todo where id = ${todoId};`;
  const dbResponse = await db.get(specificTodoquery);
  response.send(convertDBObjectToResponseObject(dbResponse));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");

    const getDateQuery = `select * from todo where due_date = '${newDate}';`;
    const dbResponse = await db.all(getDateQuery);
    response.send(
      dbResponse.map((eachItem) => convertDBObjectToResponseObject(eachItem))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");

          const postQuery = `insert into todo (id, todo, priority, status, category, due_date)
                values (${id}, '${todo}', '${priority}', '${status}', '${category}', '${newDueDate}');`;
          await db.run(postQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const requestBody = request.body;

  const PreviousTodoQuery = `select * from todo where id = ${todoId};`;
  const previousTodo = await db.get(PreviousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = requestBody;

  let updateTodo;

  //we are using switch cast

  switch (true) {
    //updating Status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodo = `update todo set 
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}' 
                where id = ${todoId};`;

        await db.run(updateTodo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //Updating priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodo = `update todo set 
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}' 
                where id = ${todoId};`;
        await db.run(updateTodo);

        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    // Updating Todo
    case requestBody.todo !== undefined:
      updateTodo = `update todo set 
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}' 
                where id = ${todoId};`;

      await db.run(updateTodo);
      response.send("Todo Updated");

      break;

    //Updating Category

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodo = `update todo set
                todo = '${todo}',
                status = '${status}',
                priority = '${priority}',
                category = '${category}',
                due_date = '${dueDate}' where id = ${todoId};`;

        await db.run(updateTodo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Updating due date
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");

        updateTodo = `update todo set
                todo = '${todo}', 
                status = '${status}',
                priority = '${priority}',
                category = '${category}',
                due_date = '${newDueDate}' 
                where id = ${todoId};`;

        await db.run(updateTodo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});
//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `delete from todo where id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
