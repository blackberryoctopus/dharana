/*
States
STARTING -> NOT_ASANA
         -> READY -> FETCHING -> AVAILABLE
*/

var asanaTaskPattern = /^https:\/\/app\.asana\.com\/0\/\d+\/\d+$/
var dharanaStartPattern = /\[dharana (start|end) (\d+)\]$/
var activeTasks = {}

var currentTask = null
var currentTaskId = null
var currentUser = null

function dlog(msg) {
	console.log("[dharana-bg] " + msg)
}

function getTask(taskid, callback) {
	dlog("Fetching data for task ID " + taskid)
	// Get main task data
	$.getJSON('https://app.asana.com/api/1.0/tasks/' + taskid, function(data) {
		currentTask = {id:data.data.id, completed:data.data.completed, completed_at:data.data.completed_at}
		currentTask.starts = {}

		dlog("Fetching stories for task ID " + taskid)
		// Get task stories
		$.getJSON('https://app.asana.com/api/1.0/tasks/' + taskid + '/stories', function(data) {
			var lastTxId = -1

			$.each(data.data, function(idx,story) {
				dlog("Processing story " + JSON.stringify(story))
				if (story.created_by.id == currentUser.id) {
					var matches = dharanaStartPattern.exec(story.text)
					if (matches && matches.length == 3) {
						var evt = matches[1]
						var evtTime = (new Date(story.created_at)).getTime()
						var txId = matches[2]
					
						if (currentTask.starts[txId] != undefined) {
							currentTask.starts[txId][evt] = evtTime
						} else {
							var newObj = {}
							newObj[evt] = evtTime
							currentTask.starts[txId] = newObj
						}

						lastTxId = (txId > lastTxId ? txId : lastTxId)
					}
				}
			})

			currentTask.lastTxId = lastTxId

			// If task is completed, automatically "close" last transaction
			if (currentTask.completed && currentTask.starts[lastTxId].end == undefined) {
				currentTask.starts[lastTxId].end = currentTask.completed_at
			}

			console.log("Calling callback: " + JSON.stringify(currentTask))
			callback(currentTask)
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
		dlog("Task start logged with txid " + txid)
		currentTask.lastTxId = txid
		currentTask.starts[txid] = {start:(new Date(asanaResp.data.created_at)).getTime()}
		callback(currentTask)
		dlog("Current task now " + JSON.stringify(currentTask))
	})
}

function pauseAsanaTask(task, txid, callback) {
	addStory(task.id, "Paused work [dharana end " + txid + "]", function(asanaResp) {
		dlog("Task pause logged")
		currentTask.starts[txid].end = (new Date(asanaResp.data.created_at)).getTime()
		callback(currentTask)
		dlog("Current task now " + JSON.stringify(currentTask))
	})
}

function checkAsanaTask(tab) {
	if (asanaTaskPattern.test(tab.url)) {
		var taskComponents = tab.url.substr(24).split('/')
		if (taskComponents[0] != taskComponents[1]) {
			chrome.pageAction.show(tab.id)
			currentTaskId = taskComponents[1]
		}
	} else {
		currentTask = null
	}
}

chrome.tabs.onActivated.addListener(function(info) { chrome.tabs.get(info.tabId, checkAsanaTask) })
chrome.tabs.onUpdated.addListener(function(id, info, tab) { checkAsanaTask(tab) })

dlog("Fetching user data")
$.getJSON('https://app.asana.com/api/1.0/users/me', function(data) {
	currentUser = data.data
	dlog("Current user is " + JSON.stringify(currentUser))

	chrome.runtime.onMessage.addListener(function(msg, sender, resp) {
		dlog("Got a message: " + JSON.stringify(msg))
		switch(msg.msg) {
			case "gettask":
				getTask(currentTaskId, resp)
				return true
			case "getuser":
				resp(currentUser)
				return false
			case "starttask":
				startAsanaTask(currentTask, resp)
				return true
			case "pausetask":
				pauseAsanaTask(currentTask, msg.data.txid, resp)
				return true
		}
	})
})
