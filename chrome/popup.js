var currentTask = {}

$(window).load(function() {
	Dharana.LOGNAME = 'dharana-popup'
	Dharana.dlog("Requesting task data")
	chrome.runtime.sendMessage({msg:Dharana.MSG_QT_LASTTASK}, function(task) {
		Dharana.dlog('Got last active task data: ' + JSON.stringify(task))
		if (task.id != null) {
			$("#active_task_title").text(task.title)
		} else {
			$("#active_task_title").text("No active task")
			Dharana.dlog("No active task")
		}
	})
})
