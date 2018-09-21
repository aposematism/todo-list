//Imports
const http = require('http');
const url = require('url');
const express = require('express');
const bodyParser = require("body-parser");
const Pool = require('pg-pool');

//heroku/host related stuff.
var port = process.env.PORT || 8081;//This is apparently appropriate for the background process running the app. It lets the app itself default to 8080 if not run in heroku.
const localDBUrl = "postgresql://fangzhao:457866@localhost:5432/nwen304-todo";
const databaseUrl = process.env.DATABASE_URL || localDBUrl;

//postgres setup related stuff, taken from https://github.com/brianc/node-pg-pool
const params = url.parse(databaseUrl);
const auth = params.auth.split(':');

const config = {
  user : auth[0],
  password : auth[1],
  host : params.hostname,
  port : params.port,
  database : params.pathname.split('/')[1],
  ssl : true
};
const pool = new Pool(config);

//Express related
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));//I discovered this was necessary to handle urls encoded.
app.use(bodyParser.json());//necessary to pass json objects.

//Application Routes.
app.get('/', function (request, response) {
  console.log("[Log] Received a GET '/', displaying the index");
  response.redirect("/index.html");
});

//Retrieve list of todos from postgres.
app.get("/todo/", function(request, response){
  console.log("Received a GET request for '/todoList/'");
  pool.connect().then(client => {
    client.query("SELECT * FROM todoList;")//query and return the results.
      .then(result => {
        client.release();//Release lock on database.
        response.send(result.rows);
      }).catch(err => {
        client.release();
        response.status(500).send("Database Error.");//internal server error.
      });
  })
  .catch(error => {
     response.status(503).send("Database unavailable. Please try again later!");
  })
});

//Adds new item to the database
app.post("/todo/", function(request, response){
  console.log("Received a POST request for /todoList/ new entry.");
  pool.connect().then(client => {
    client.query("INSERT INTO todoList (task, complete) VALUES ($1, FALSE) RETURNING taskId", [request.params.task]).then(result => {//Returns the task ID for identification of the specific task on the front end.
      client.release();
      let id = result.rows[0].taskId;
      response.status(200).json({taskId: id});
      console.log("Sucessfully added new instance to table.");

    }).catch(err => {
      client.release();
      response.status(500).send("Database Error.");//internal server error.
      console.log("Unable to add new entry to table.");
    });
  }).catch(error => {
    response.status(503).send("Database unavailable. Please try again later!");
    console.log("Database Error during connection to pool.");

  });
});
//updates items within the database.


//Delete item from the database.
app.delete("/todo/:id", function(request, response){
  console.log("Received a DELETE request for /todoList/ to delete an instance.");
  let id = request.params.taskId;
  pool.connect().then(client => {
    client.query("DELETE from todoList where taskId = $1;", [id]).then(result => {
      client.release();
      if(result.rowCount > 0){
        response.status(200);
        console.log("Deleted some instance.");
      }
      else{
        response.status(410).send("Can't find requested item in Database.");
        console.log("Unable to delete some instance requested by connection.");

      }
    }).catch(err => {
        client.release();
        response.status(500).send("Database Error.");
        console.log("Database error occured during the deletion of some instance.");
    })
  }).catch(error => {
    response.status(503).send("Database unavailable. Please try again later!");
    console.log("Database failure, caught error during connection to pool.");

  });
});

//===============SERVER STARTUP===============
const server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("To-Do List app listening at http://%s:%s", host, port);
});
