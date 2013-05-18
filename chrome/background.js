var asanaTaskPattern = /^https:\/\/app\.asana\.com\/0\/\d+\/\d+$/
var currentTaskId = null

function getTask(taskid, callback) {
	console.log("Getting task data")

	// Get main task data
	$.getJSON('https://app.asana.com/api/1.0/tasks/' + taskid, function(data) {
		var currentTask = {type:"task"}
		console.log("Got main task data: " + JSON.stringify(data.data))
		currentTask.task = data.data

		// Get task stories
		$.getJSON('https://app.asana.com/api/1.0/tasks/' + taskid + '/stories', function(data) {
			console.log("Got task stories: " + JSON.stringify(data.data))
			currentTask.stories = data.data

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

function checkAsanaTask(tab) {
	if (asanaTaskPattern.test(tab.url)) {
		var taskComponents = tab.url.substr(24).split('/')
		if (taskComponents[0] != taskComponents[1]) {
			chrome.pageAction.show(tab.id)
			currentTaskId = taskComponents[1]
		}
	}
}

chrome.tabs.onActivated.addListener(function(info) { chrome.tabs.get(info.tabId, checkAsanaTask) })
chrome.tabs.onUpdated.addListener(function(id, info, tab) { checkAsanaTask(tab) })

chrome.runtime.onMessage.addListener(function(msg, sender, resp) {
	console.log("Got a message: " + JSON.stringify(msg))
	switch(msg.msg) {
		case "gettask":
			getTask(currentTaskId, function(dat) { resp(dat) })
			return true
		case "starttask":
			addStory(msg.data.taskid, "dharana_start", resp)
			return true
		case "pausetask":
			addStory(msg.data.taskid, "dharana_end", resp)
			return true
	}
})
