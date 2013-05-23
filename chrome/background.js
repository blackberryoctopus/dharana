/*
States
STARTING -> NOT_ASANA
         -> READY -> FETCHING -> AVAILABLE
*/

var asanaTaskPattern = /^https:\/\/app\.asana\.com\/0\/([0-9]+)\/([0-9]+)$/
var dharanaStartPattern = /\[dharana (start|end) (\d+)\]$/
var activeTasks = {}
var lastStartedTask = {id:null, title:""}

var currentUser = null

function getTask(taskid, callback) {
	Dharana.dlog("Fetching data for task ID " + taskid)
	// Get main task data
	$.getJSON('https://app.asana.com/api/1.0/tasks/' + taskid, function(data) {
		var task = {id:data.data.id, name:data.data.name, completed:data.data.completed, completed_at:data.data.completed_at}
		task.starts = {}

		Dharana.dlog("Fetching stories for task ID " + taskid)
		// Get task stories
		$.getJSON('https://app.asana.com/api/1.0/tasks/' + taskid + '/stories', function(data) {
			var lastTxId = -1

			$.each(data.data, function(idx,story) {
				if (story.created_by.id == currentUser.id) {
					var matches = dharanaStartPattern.exec(story.text)
					if (matches && matches.length == 3) {
						var evt = matches[1]
						var evtTime = (new Date(story.created_at)).getTime()
						var txId = matches[2]
					
						if (task.starts[txId] != undefined) {
							task.starts[txId][evt] = evtTime
						} else {
							var newObj = {}
							newObj[evt] = evtTime
							task.starts[txId] = newObj
						}

						lastTxId = (txId > lastTxId ? txId : lastTxId)
					}
				}
			})

			task.lastTxId = lastTxId

			// If task is completed, automatically "close" last transaction
			if (task.completed && task.starts[lastTxId].end == undefined) {
				task.starts[lastTxId].end = task.completed_at
			}

			callback(task)
		})
	})
}

function addStory(taskid, storyText, callback) {
	$.post('https://app.asana.com/api/1.0/tasks/' + taskid + '/stories',
		{"text":storyText},
		function(data, status, xhr) {
			callback(data)
		},
		"json")
}

function startAsanaTask(task, callback) {
	var txid = (new Date()).getTime()
	addStory(task.id, "Started work [dharana start " + txid + "]", function(asanaResp) {
		Dharana.dlog("Task start logged with txid " + txid)
		task.lastTxId = txid
		task.starts[txid] = {start:(new Date(asanaResp.data.created_at)).getTime()}

		callback(task)
	})
}

function pauseAsanaTask(task, txid, callback) {
	addStory(task.id, "Paused work [dharana end " + txid + "]", function(asanaResp) {
		Dharana.dlog("Task pause logged")
		task.starts[txid].end = (new Date(asanaResp.data.created_at)).getTime()
		callback(task)
	})
}

function timeSpent(task) {
	var time = 0;
	$.each(task.starts, function(idx, start) {
		if (start.start != undefined && start.end != undefined) {
			time += (start.end - start.start)
		}
	})

	return time;
}

function toggleTask(taskurl, callback) {
	var taskUrlComponents = asanaTaskPattern.exec(taskurl)
	if (taskUrlComponents && taskUrlComponents.length == 3 && taskUrlComponents[1] != taskUrlComponents[2]) {
		var taskid = taskUrlComponents[2]
		Dharana.dlog('Toggling task ' + taskid + ' for url ' + taskurl)

		// Check our task cache first
		// If task is not in cache, then refetch it and try again
		// (via recursive call)

		if (activeTasks[taskid] != undefined) {
			var task = activeTasks[taskid]
			Dharana.dlog('Got task ' + JSON.stringify(task))

			if ($.isEmptyObject(task.starts) || task.starts[task.lastTxId].end != undefined) {
				// No starts or last start closed
				Dharana.dlog('Starting task')
				startAsanaTask(task, function(updatedTask) {
					lastStartedTask.id = task.id
					lastStartedTask.title = task.name
					chrome.browserAction.setBadgeBackgroundColor({color:"#2ECC71"})
					chrome.browserAction.setBadgeText({text:"A"})
					Dharana.dlog('lastStartedTask is now ' + JSON.stringify(lastStartedTask))

					var time = timeSpent(updatedTask)
					callback({id: updatedTask.id, action: "started", time:time})
				})
			} else {
				// Have starts and last start open, so need to pause
				Dharana.dlog('Pausing task with txid ' + task.lastTxId)
				pauseAsanaTask(task, task.lastTxId, function(updatedTask) {
					chrome.browserAction.setBadgeText({text:""})
					lastStartedTask.id = null
					lastStartedTask.title = ""
					Dharana.dlog('lastStartedTask is now ' + JSON.stringify(lastStartedTask))

					var pausedStart = task.starts[task.lastTxId]
					callback({id: updatedTask.id, action: "paused", time:(pausedStart.end - pausedStart.start)})
				})
			}
		} else {
			Dharana.dlog('Fetching task data')
			getTask(taskid, function(task) {
				activeTasks[taskid] = task
				toggleTask(taskurl, callback)
			})
		}
	}
}

function returnLastActiveTask(callback) {
	var title = (lastStartedTask.id != null ? lastStartedTask.title : "")
	callback({
		id: lastStartedTask.id,
		title: title
	})
}

Dharana.LOGNAME = 'dharana-bg'

// Fetch user data and start listening for
// messages from the browser UI components

Dharana.dlog("Fetching user data")
$.getJSON('https://app.asana.com/api/1.0/users/me', function(data) {
	currentUser = data.data
	Dharana.dlog("Current user is " + JSON.stringify(currentUser))

	chrome.runtime.onMessage.addListener(function(msg, sender, resp) {
		Dharana.dlog("Got a message: " + JSON.stringify(msg || '{msg:"none"}'))
		switch(msg.msg) {
			case Dharana.MSG_QT_TOGGLE:
				toggleTask(msg.data, resp)
				return true
			case Dharana.MSG_QT_LASTTASK:
				Dharana.dlog(JSON.stringify(lastStartedTask))
				resp(lastStartedTask)
				return false
		}
	})
})
