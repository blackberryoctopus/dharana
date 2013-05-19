var currentTask = {}

dlog = function(msg) {
	console.log("[dharana-pop-page] " + msg)
}

startTask = function(task) {
	dlog("Starting task " + task.id)
	chrome.runtime.sendMessage({msg:"starttask",data:{taskid:task.id}}, function(updatedTask) {
		dlog("Task successfully started " + JSON.stringify(updatedTask))
		setCurrentTask(updatedTask)
	})
}

pauseTask = function(task) {
	dlog("Pausing task " + task.id)
	chrome.runtime.sendMessage({msg:"pausetask",data:{taskid:task.id, txid:task.lastTxId}}, function(updatedTask) {
		dlog("Task successfully paused " + JSON.stringify(updatedTask))
		setCurrentTask(updatedTask)
	})
}

getTaskState = function(task) {
	var state = "UNKNOWN" // -> NOT_STARTED -> ACTIVE -> HOLD -> COMPLETED
	var incompletes = 0

	if (task.completed == false) {
		if ($.isEmptyObject(task.starts)) {
			state = "NOT_STARTED"
		} else {
			state = (task.starts[task.lastTxId].end == undefined ? "ACTIVE" : "HOLD")
		}
	} else {
		state = "COMPLETED"
	}

	return state
}

setTaskStateUI = function(state) {
	if (state == "NOT_STARTED" || state == "HOLD") {
		$("div#start").css('display', 'block')
		$("div#pause").css('display', 'none')
		$("div#taskcomplete").css('display', 'none')
	} else if (state == "ACTIVE") {
		$("div#start").css('display', 'none')
		$("div#pause").css('display', 'block')
		$("div#taskcomplete").css('display', 'none')
	} else if (state == "COMPLETED") {
		$("div#start").css('display', 'none')
		$("div#pause").css('display', 'none')
		$("div#taskcomplete").css('display', 'block')
	}
}

setCurrentTask = function(task) {
	currentTask = task
	setTaskStateUI(getTaskState(currentTask))
}

$(window).load(function() {
	// Setup handlers
	$("#start").click(function(evt) {
		startTask(currentTask)
	})

	$("#pause").click(function(evt) {
		pauseTask(currentTask)
	})

	dlog("Requesting task data")
	chrome.runtime.sendMessage({msg:"gettask"}, function(task) {
		dlog("Got task data " + JSON.stringify(task))
		setCurrentTask(task)
	})
})
