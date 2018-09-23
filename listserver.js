//Imports
const http = require('http');
const url = require('url');
const express = require('express');
const bodyParser = require("body-parser");
const Pool = require('pg-pool');

//heroku/host related stuff.
var port = process.env.PORT || 8081;//This is apparently appropriate for the background process running the app. It lets the app itself default to 8080 if not run in heroku.
const localDBUrl = "postgres://maavnqtyrzashf:9e38e31d99ee60950d1dddcca9635e5a003a1f07669b9d4b9fe12f6168b2b453@ec2-54-83-62-190.compute-1.amazonaws.com:5432/ddopg2vque6ne8";
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
        console.log("Successfully returned all instances within the database.");
      }).catch(err => {
        client.release();
        response.status(500).send("Database Error.");//internal server error.
        console.log("Unable to retrieve from the database for some reason.");
      });
  })
  .catch(error => {
     response.status(503).send("Database unavailable. Please try again later!");
     console.log("Unable to connect to the database!.");

  })
});

//Adds new item to the database
app.post("/todo/", function(request, response){
  console.log("Received a POST request for /todoList/ new entry.");
  pool.connect().then(client => {
    client.query("INSERT INTO todoList (task, complete) VALUES ($1, FALSE) RETURNING taskid;", [request.body.task])
      .then(result => {//Returns the task ID for identification of the specific task on the front end.
        client.release();
        let id = result.rows[0].taskid;
        console.log(id);
        let res = {
          id : id
        }
        response.status(200).json(res);
        console.log("Sucessfully added new instance to table.");
    }).catch(err => {
      client.release();
      response.status(500).send("Database Error.");//internal server error.
      console.log("Unable to add new entry to table.");
    });
  })
  .catch(error => {
    response.status(503).send("Database unavailable. Please try again later!");
    console.log("Database Error during connection to pool.");
  });
});

//updates entry name within the database.
app.post("/todo/update/", function(request, response){
  console.log("Received UPDATE request for todoList to update an instance task entry.");
  pool.connect().then(client => {
    client.query("UPDATE todoList SET task = $1 WHERE taskid = $2;", [request.body.task, request.body.selected])
    .then(result => {
      client.release();
      if(result.rowCount > 0){
         response.status(200).send("Successfully updated!");
         console.log("Successfully updated instance task entry.");
      }
      else{
        response.status(404).send("Unable to locate instance for updating.");
        console.log("Unable to update instance task entry.");
      }
    }).catch(err => {
      client.release();
      response.status(500).send("Database Error.");
      console.log("Database error occured during the update of some instance.");
      console.log('Query error: ', err.message, err.stack);
    });
  }).catch(error => {
    response.status(503).send("Database unavailable. Please try again later!");
    console.log("Database failure, caught error during connection to pool.");
  });
});

//updates todo vs complete status within the database.
app.post("/todo/complete/", function(request, response){
  console.log("Received UPDATE request for todoList to update an instance task entry.");
  let finished = request.body.complete;
  console.log(request.body.complete);
  console.log(request.body.selected);
  if(request.body.complete == 'false'){
    finished = true;
  }
  else{
    finished = false;
  }
  pool.connect().then(client => {
    client.query("UPDATE todoList SET complete = $1 WHERE taskid = $2 RETURNING complete;", [finished, request.body.selected])
    .then(result => {
      client.release();
      console.log(result.rows[0].complete);
      if(result.rowCount > 0){
         response.status(200).send("Successfully updated!");
         console.log("Successfully updated complete status.");
      }
      else{
        response.status(404).send("Unable to locate instance for updating.");
        console.log("Unable to update complete status.");
      }
    }).catch(err => {
      client.release();
      response.status(500).send("Database Error.");
      console.log("Database error occured during the update of some instance.");
      console.log('Query error: ', err.message, err.stack);
    });
  }).catch(error => {
    response.status(503).send("Database unavailable. Please try again later!");
    console.log("Database failure, caught error during connection to pool.");
  });
});

//Delete item from the database.
app.post("/todo/delete/", function(request, response){
  console.log("Received a DELETE request for /todoList/ to delete an instance.");
  pool.connect().then(client => {
    client.query("DELETE from todoList where taskid = $1;", [request.body.selected]).then(result => {
      client.release();
      if(result.rowCount > 0){
        response.status(200).send("Sucessfully deleted!");
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
        console.log('Query error: ', err.message, err.stack);
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
