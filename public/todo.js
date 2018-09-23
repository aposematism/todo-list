$(document).ready(function(e) {
  var fieldVar;
  var currentVar;

  //Retrieves all the tasks from the database.
  //Retrieves each row as a json object, retrieves the properties of it.
  $.get("/todo/")
    .done(function(returnedList){
      console.log("Attempting to call the database for all list instances.");
      for(let instance of returnedList){//Build the instace from the data then add it to a list based on the complete status.
        let $item = $(`<li class='task-item' id='todo-${instance.taskid}' data-finished='${instance.complete}'></li>`)
        .append('<span class="done">%</span>')
        .append(`<span class="title">${instance.task}</span>`)
        .append('<span class="delete">x</span>')
        .append('<span class="edit">r</span>');
        if(instance.complete){
          $('#completed-list').prepend($item);
        }
        else{
          $('#todo-list').prepend($item);
        }
        console.log("Succeeded in calling the database.");
      }
    }).fail(function(returnedList){
      $('.warning')
        .empty()
        .append(`<span>${returnedList.responseText}</span>`)
        .show();
        console.log("Failed to call database.");
    });

  //Interactive Button,
  $('#add-todo').button({
    icons: { primary: "ui-icon-circle-plus" }})
    .click( function() {
      console.log("Pushed new task button.");
      $('#new-todo').dialog('open');
  });

  //Dialog Box for new entry, also handles posting to the backend database via a posted son object containing the task.
  $('#new-todo').dialog({
    modal : true, autoOpen : false,
    title: "Add new Task",
    buttons : {
      "Add task" : function() {
        let task = $("#task").val();
        if (task === '') { return false; }
        let $newTask = $(task);
        let nT = {
          task: task
        };
        $.post("/todo/", nT).done(function(response){//Sends the json object to be stored for later in the postgres database. Then it takes the returned id to craft the HTML.
          console.log(response.id);
          let $newTask = $(`<li class='task-item' id='todo-${response.id}' data-finished='${false}'></li>`)//id is a generated serial, turned out to be necessary to identify the items row.
          .append('<span class="done">%</span>')
          .append(`<span class="title">${nT.task}</span>`)
          .append('<span class="delete">x</span>')
          .append('<span class="edit">r</span>');
          $('#todo-list').prepend($newTask);
          $newTask.show('clip',250).effect('highlight',1000);
          console.log("Successfully posted to database.");
        }).fail(function(data){
          $(".warning")
            .empty()
            .append(`<span>${data.responseText}</span>`)
            .show();
            console.log("Failed to post new task to database.");
        });
        $(this).dialog('close');
      },
      "Cancel" : function () {
        console.log("Cancelled new task add.");
        $(this).dialog('close');
      }
    }
  });

  //Sorts the items in alphabetical order, applies to both lists independently.
  $('.sortlist').sortable({
    connectWith : '.sortlist',
    cursor : 'pointer',
    placeholder : 'ui-state-highlight',
    cancel : '.delete,.done'
  });

  //Clicking done moves from todo to completed list.
  $('.sortlist').on('click', '.done', function() {
    var $this = $(this);
    var fieldVar = $(this).parents("li");
    let complete = fieldVar.attr("data-finished");
    let selected = fieldVar.attr("id").slice(5);
    console.log(complete);
    console.log(selected);
    let updated = {
      complete: complete,
      selected : selected
    };
    $.post("/todo/complete/", updated).done(function(){
      console.log(`Updated complete status of Instance with Id = ${updated.selected}`);
      if(complete == 'false'){
        todoStatus = 'true';
      }
      else{
        todoStatus = 'false';
      }
      fieldVar.attr("data-finished", todoStatus).slideUp(250, function () {
        $this = $(this);
        $this.detach();
        if(complete == 'false'){
          $('#completed-list').prepend(fieldVar);
        }
        else{
          $('#todo-list').prepend(fieldVar);
        }
        $this.slideDown();
      });
    }).fail(function(data){
      $(".warning")
        .empty()
        .append(`<span>${data.responseText}</span>`)
        .show();
        console.log("Failed to update complete status of task in database.");
    });
  });

  //
  $('.sortlist').on('click','.delete',function() {
    fieldVar = $(this).parents("li");
    currentVar = $(this);
    console.log("Attempting to delete instance.")
    $('#confirm').dialog('open');
  });

  //Handles the deletion of items.
  $('#confirm').dialog({
    modal : true, autoOpen : false,
    title: "Delete a Task",
    buttons : {
      "Confirm" : function() {
        let $instance = fieldVar;
        let name = $.trim(fieldVar.children(".title").text());
        let selected = fieldVar.attr("id").slice(5);
        console.log(selected);
        let erased = {
          selected : selected
        };
        $.post("/todo/delete/", erased).done(function(){
          console.log("Deleting instance from view!");
          fieldVar.effect('puff', function() {
            currentVar.remove();
          });
        console.log(`Deleted Instance with Id = ${erased.selected}`);
        }).fail(function(data){
          $(".warning")
            .empty()
            .append(`<span>${data.responseText}</span>`)
            .show();
            console.log("Failed to delete selected task in database.");
        });
        $(this).dialog('close');
      },
      "Cancel" : function() {
        console.log("Cancelled deletion of item.");
        $(this).dialog('close');
      }
    }
  });

  //Handles edit clicks on todo.
  $('.sortlist').on('click','.edit',function() {
    fieldVar = $(this).parents("li");
    currentVar = $(this);
    $('#edit').dialog('open');
  });

  //Enables the name editing for entries.
  $('#edit').dialog({
    modal : true, autoOpen : false,
    title: "Update a Task",
    buttons : {
      "Confirm" : function() {
        let task = $("#newTask").val();
        console.log(task);
        if (task === '') { return false; }
        let $newTask = $(task);
        let selected = fieldVar.attr("id").slice(5);
        console.log(selected);
        let updatedTask = {
          task : task,
          selected : selected
        };
        $.post("/todo/update/", updatedTask).done(function(){
          console.log("Updated HTML frontend.");
          fieldVar.children(".title").text(task);
        }).fail(function(data){
          $(".warning")
            .empty()
            .append(`<span>${data.responseText}</span>`)
            .show();
            console.log("Failed to update selected task in database.");
        });
        $(this).dialog('close');
      },
      "Cancel" : function() { $(this).dialog('close');}
    }
  });
}); // end ready
