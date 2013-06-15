/*
States
STARTING -> NOT_ASANA
         -> READY -> FETCHING -> AVAILABLE
*/

var asanaTaskPattern = /^https:\/\/app\.asana\.com\/0\/([0-9]+)\/([0-9]+)$/
var dharanaStartPattern = /\[dharana (start|end) (\d+)\]$/
var dailyTimes = {}
var activeTasks = {}

var currentUser = null

function getTask(taskid, stories, callback) {
	Dharana.dlog("Fetching data for task ID " + taskid)
	// Get main task data
	$.getJSON('https://app.asana.com/api/1.0/tasks/' + taskid, function(data) {
		var task = new DharanaTask(data.data)

		if (!stories) {
			callback(task)
			return
		}

		Dharana.dlog("Fetching stories for task ID " + taskid)
		// Get task stories
		$.getJSON('https://app.asana.com/api/1.0/tasks/' + taskid + '/stories', function(data) {
			var lastTxId = -1

			$.each(data.data, function(idx, story) {
				if (story.created_by.id == currentUser.id) {
					var matches = dharanaStartPattern.exec(story.text)
					if (matches && matches.length == 3) {
						var evt_type = matches[1]  // event type
						var evt_tm = (new Date(story.created_at)).getTime() // when event was logged
						var txid = matches[2] // event transaction id

						task.addEvent(txid, evt_type, evt_tm)
					}
				}
			})

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
		task.addEvent(txid, 'start', new Date(asanaResp.data.created_at).getTime())
		callback(task)
	})
}

function pauseAsanaTask(task, txid, callback) {
	addStory(task.id, "Paused work [dharana end " + txid + "]", function(asanaResp) {
		Dharana.dlog("Task pause logged")
		task.addEvent(txid, 'end', new Date(asanaResp.data.created_at).getTime())
		callback(task)
	})
}

function logDateStr(date) {
	return (date.getFullYear() * 10000) + (date.getMonth() * 100) + (date.getDate())
}

function timeFragmentInfo(callback) {
	var today = new Date()
	var midnightMillis = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
	var now = Date.now()

	var frag_tree = new FragmentTree()

	$.each(activeTasks, function(tid, task) {
		$.each(task.timeBlocks, function(txid, timeBlock) {
			frag_tree.addFragment(timeBlock.start, timeBlock.end)
		})
	})

	var frag_list = frag_tree.fragmentList(midnightMillis, now)
	var start = frag_list.length > 0 ? frag_list[0].start : undefined
	var end = frag_list.length > 0 ? frag_list[frag_list.length - 1].end : undefined
	var totalTime = end - start
	var loggedTime = now - start
	var activeTime = 0

	$.each(frag_list, function(idx, span) {
		activeTime += (span.end - span.start)
	})

	callback({start:start, end:end, total:totalTime, logged:loggedTime, active:activeTime, data:frag_list})
}

function updateBadge() {
	var numActive = 0
	var numOnHold = 0
	$.each(activeTasks, function(tid, task) {
		if (!task.completed) {
			switch(task.getState()) {
				case Dharana.TASKSTATE_ONHOLD:
					++numOnHold
					break
				case Dharana.TASKSTATE_ACTIVE:
					++numActive
					break
			}
		}
	})

	var badgeColor = "#2ECC71" // Badge default to green
	if (numActive == 0) {
		badgeColor = "#D35400" // if no active tasks, badge goes pumpkin
	}

	var badgeText = (numActive == 0 && numOnHold == 0) ? "" : numActive + numOnHold + ''

	chrome.browserAction.setBadgeBackgroundColor({color:badgeColor})
	chrome.browserAction.setBadgeText({text:badgeText})
}

function addActiveTask(task) {
	if (activeTasks[task.id] == undefined) {
		activeTasks[task.id] = task
		updateBadge()
	}
}

function removeActiveTask(task) {
	if (activeTasks[task.id] != undefined) {
		// delete activeTasks[task.id]
		if (!activeTasks[task.id].completed) {
			activeTasks[task.id].completed = task.completed
			activeTasks[task.id].completed_at = task.completed_at
			updateBadge()
		}
	}
}

/*
Toggles a task described an Asana URL
*/

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
			task.lastUrl = taskurl
			Dharana.dlog('Got task ' + JSON.stringify(task))

			var state = task.getState()
			Dharana.dlog('Task status is ' + state)

			if (state === Dharana.TASKSTATE_ONHOLD || state === Dharana.TASKSTATE_DEFAULT) {
				// No starts or last start closed

				Dharana.dlog('Starting task')
				startAsanaTask(task, function(updatedTask) {
					var time = updatedTask.timeSpent()
					callback({id: updatedTask.id, action: "started", time:time})
					updateBadge()
				})
			} else if (state === Dharana.TASKSTATE_ACTIVE) {
				// Have starts and last start open, so need to pause

				Dharana.dlog('Pausing task with txid ' + task.lastTxId)
				pauseAsanaTask(task, task.lastTxId, function(updatedTask) {
					var pausedStart = task.timeBlocks[task.lastTxId]
					callback({id: updatedTask.id, action: "paused", time:(pausedStart.end - pausedStart.start)})
					updateBadge()
				})
			}
		} else {
			Dharana.dlog('Fetching task data')
			getTask(taskid, true, function(task) {
				task.lastUrl = taskurl
				addActiveTask(task)
				toggleTask(taskurl, callback)
			})
		}
	}
}

function popupTaskRecord(task) {
	return {id:task.id, name:task.name, link:task.lastUrl}
}

function tasks(callback) {
	var taskList = {activeTasks:[], startedTasks:[]}
	$.each(activeTasks, function(tid, task) {
		if (!task.completed) {
			switch(task.getState()) {
				case Dharana.TASKSTATE_ACTIVE:
					taskList.activeTasks.push(popupTaskRecord(task))
					break
				case Dharana.TASKSTATE_ONHOLD:
					taskList.startedTasks.push(popupTaskRecord(task))
					break
			}
		}
	})

	callback(taskList)
}

Dharana.LOGNAME = 'dharana-bg'

updateBadge()

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
			case Dharana.MSG_QT_TASKS:
				tasks(resp)
				return true
			case Dharana.MSG_QT_FRAGMENTATION:
				timeFragmentInfo(resp)
				return true
		}
	})
})

// Setup timer to check status of active tasks
var checkDoneTimer = setInterval(function() {
		$.each(activeTasks, function(tid, task) {
			if (!task.completed) {
				getTask(tid, false, function(retrievedTask) {
					if (retrievedTask.completed) {
						var lastTxId = task.lastTxId
						if (task.timeBlocks[lastTxId].end == undefined) {
							pauseAsanaTask(task, lastTxId, function() {
								Dharana.dlog('Tx ' + lastTxId + ' on task ' + tid + ' automatically paused due to completion.')
								removeActiveTask(retrievedTask)
							})
						} else {
							Dharana.dlog('Task ' + tid + ' is complete. Removing from active tasks.')
							removeActiveTask(retrievedTask)
						}
					}
				})
			}
		})
	}, 15000)
