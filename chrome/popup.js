startTask = function() {
	chrome.runtime.sendMessage({msg:"starttask",data:{taskid:currentTask.task.id}}, function(resp) {
		setTaskStateUI("ACTIVE")
	})
}

pauseTask = function() {
	chrome.runtime.sendMessage({msg:"pausetask",data:{taskid:currentTask.task.id}}, function(resp) {
		setTaskStateUI("HOLD")
	})
}

getTaskState = function(task) {
	var state = "UNKNOWN" // -> NOT_STARTED -> ACTIVE -> HOLD -> COMPLETED
	var starts = 0
	var pauses = 0

	if (task.task.completed == false) {
		$.each(task.stories, function(idx, story) {
			if (story.created_by.id == currentUser.id) {
				if (/\ \[dharana start\]$/.test(story.text)) {
					++starts
				} else if (/\ \[dharana end\]$/.test(story.text)) {
					++pauses
				}
			}

			if (starts <= 0) {
				state = "NOT_STARTED"
			} else {
				state = (starts > pauses ? "ACTIVE" : "HOLD")
			}
		})
	} else {
		state = "COMPLETED"
	}

	return state
}

setTaskStateUI = function(state) {
	if (state == "NOT_STARTED" || state == "HOLD") {
		$("#starttask").css('display', 'block')
		$("#pausetask").css('display', 'none')
		$("#taskcomplete").css('display', 'none')
	} else if (state == "ACTIVE") {
		$("#starttask").css('display', 'none')
		$("#pausetask").css('display', 'block')
		$("#taskcomplete").css('display', 'none')
	} else if (state == "COMPLETED") {
		$("#starttask").css('display', 'none')
		$("#pausetask").css('display', 'none')
		$("#taskcomplete").css('display', 'block')
	}
}

$(window).load(function() {
	// Setup handlers
	$("#starttask").click(function(evt) {
		startTask()
	})

	$("#pausetask").click(function(evt) {
		pauseTask()
	})

	chrome.runtime.sendMessage({msg:"getuser"}, function(user) {
		currentUser = user
	})

	console.log("Requesting task data")
	chrome.runtime.sendMessage({msg:"gettask"}, function(task) {	
		currentTask = task
		setTaskStateUI(getTaskState(task))
	})
})
