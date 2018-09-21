$(document).ready(function(e) {
  var toDelete;

  //Retrieves all the tasks from the database.
  //Retrieves each row as a json object, retrieves the properties of it.
  $.get("/todo/")
    .done(function(returnedList){
      console.log("Attempting to call the database for all list instances.");
      for(let instance of returnedList){//Build the instace from the data then add it to a list based on the complete status.
        let $item = $(`<li class='task-item' id='todo-${instance.id}' data-finished='${instance.complete}'></li>`)
        .append('<li><span class="done">%</span>')
        .append(`<span class="title">${item.task}</span>`)
        .append('<span class="delete">x</span>')
        .append('<span class="edit">r</span></li>');

        if(instance.complete){
          $('#completed-list').prepend($newTask);
        }
        else{
          $('#todo-list').prepend($newTask);
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
        let task = $('#task').val();
        if (task === '') { return false; }
        let $newTask = $(task);
        let nT = {
          task: task
        };
        $.post("/todo/", nT).done(function(returnedInstance){//Sends the json object to be stored for later in the postgres database. Then it takes the returned id to craft the HTML.
          let taskHTML = `<li class='task-item' id='todo-${returnedInstance.taskId}' data-finished='${false}'></li>`;//id is a generated serial, turned out to be necessary to identify the items row.
          taskHTML += '<li><span class="done">%</span>';
          taskHTML += '<span class="delete">x</span>';
          taskHTML += '<span class="edit">r</span>';
          taskHTML += `<span class="task">${nT.task}</span></li>`;
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

  //Clicking done moves from todo to completed list.
  $('#todo-list').on('click', '.done', function() {
    var $taskItem = $(this).parent('li');
    $taskItem.slideUp(250, function() {
      var $this = $(this);
      $this.detach();
      $('#completed-list').prepend($this);
      $this.slideDown();
    });
  });

  //Sorts the items in alphabetical order, applies to both lists independently.
  $('.sortlist').sortable({
    connectWith : '.sortlist',
    cursor : 'pointer',
    placeholder : 'ui-state-highlight',
    cancel : '.delete,.done'
  });

  //
  $('.sortlist').on('click','.delete',function() {
    toDelete = $(this);
    $('#confirm').dialog('open');
  });

  //Handles the deletion of items.
  $('#confirm').dialog({
    modal : true, autoOpen : false,
    title: "Delete a Task",
    buttons : {
      "Confirm" : function() {
        toDelete.parent('li').effect('puff', function() {
          toDelete.remove();
        });
        $(this).dialog('close');
      },
      "Cancel" : function() { $(this).dialog('close');}
    }
  });

  //Handles edit clicks on todo.
  $('#todo-list').on('click','.edit',function() {
    toDelete = $(this);
    $('#edit').dialog('open');
  });

  //Handles edit clicks on completed.
  $('#completed-list').on('click','.edit',function() {
    toDelete = $(this);
    $('#edit').dialog('open');
  });

  //Enables the name editing for entries.
  $('#edit').dialog({
    modal : true, autoOpen : false,
    title: "Update a Task",
    buttons : {
      "Confirm" : function() {
        var newName = $('#newTask').val();
        if (newName === '') { return false; }
        toDelete.parent('li').find('.task').text(newName);
        $(this).dialog('close');
      },
      "Cancel" : function() { $(this).dialog('close');}
    }
  });
}); // end ready
