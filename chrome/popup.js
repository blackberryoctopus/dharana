var currentTask = {}

$(window).load(function() {
	Dharana.LOGNAME = 'dharana-popup'
	Dharana.dlog("Requesting task data")
	chrome.runtime.sendMessage({msg:Dharana.MSG_QT_TASKS}, function(taskList) {
		Dharana.dlog('Got task list: ' + JSON.stringify(taskList))
		$.each(taskList.activeTasks, function(idx, task) {
			$("#tasks").append('<li class="task-active">' + task.name + '</li>')
		})

		$.each(taskList.startedTasks, function(idx, task) {
			$("#tasks").append('<li class="task-started">' + task.name + '</li>')
		})
	})
})
