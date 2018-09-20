$(document).ready(function(e) {
  var toDelete;

  $('#add-todo').button({
    icons: { primary: "ui-icon-circle-plus" }}).click(
      function() {
        $('#new-todo').dialog('open');
      });
  $('#new-todo').dialog({
    modal : true, autoOpen : false,
    buttons : {
      "Add task" : function() {
        var taskName = $('#task').val();
        if (taskName === '') { return false; }
        var taskHTML = '<li><span class="done">%</span>';
        taskHTML += '<span class="delete">x</span>';
        taskHTML += '<span class="edit">r</span>';
        taskHTML += '<span class="task"></span></li>';
        var $newTask = $(taskHTML);
        $newTask.find('.task').text(taskName);
        $newTask.hide();
        $('#todo-list').prepend($newTask);
        $newTask.show('clip',250).effect('highlight',1000);
        $(this).dialog('close');
      },
      "Cancel" : function () { $(this).dialog('close');}
    }
  });
  $('#todo-list').on('click', '.done', function() {
    var $taskItem = $(this).parent('li');
    $taskItem.slideUp(250, function() {
      var $this = $(this);
      $this.detach();
      $('#completed-list').prepend($this);
      $this.slideDown();
    });
  });
  $('.sortlist').sortable({
    connectWith : '.sortlist',
    cursor : 'pointer',
    placeholder : 'ui-state-highlight',
    cancel : '.delete,.done'
  });
  $('.sortlist').on('click','.delete',function() {
    toDelete = $(this);
    $('#confirm').dialog('open');
  });
  $('#confirm').dialog({
    modal : true, autoOpen : false,
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
  $('#todo-list').on('click','.edit',function() {
    toDelete = $(this);
    $('#edit').dialog('open');
  });
  $('#edit').dialog({
    modal : true, autoOpen : false,
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
