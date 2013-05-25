var currentTask = {}

function createTaskListItem(task, taskState) {
	var taskClass = ''
	switch(taskState) {
		case "active":
			taskClass = 'task-active'
			break
		case "started":
			taskClass = 'task-started'
			break
	}

	var taskListItem = $('<li>', {
		class: taskClass
	})

	taskListItem.hover(
		function(evt) {
			Dharana.dlog('hover in on task ' + task.id)
			$('ul#tasks > li > span#' + task.id).css('visibility', 'visible')
		},
		function(evt) {
			Dharana.dlog('hover out on task ' + task.id)
			$('ul#tasks > li > span#' + task.id).css('visibility', 'hidden')
		})

	var taskNameSpan = $('<div>', {class: 'taskname', text: task.name}).appendTo(taskListItem)
	var taskLinkSpan = $('<span>', {
		class: 'link',
		id: task.id
	})

	var taskLinkIcon = $('<i>', {class: 'icon-chevron-right icon-white'}).appendTo(taskLinkSpan)
	taskLinkIcon.click(function(evt) {
		chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
			if (tabs.length > 0) {
				chrome.tabs.update(tabs[0].id, {url: task.link})
			} else {
				Dharana.dlog("Couldn't get active tab")
			}
		})
	})

	taskLinkSpan.appendTo(taskListItem)

	return taskListItem
}

$(window).load(function() {
	Dharana.LOGNAME = 'dharana-popup'
	Dharana.dlog("Requesting task data")
	chrome.runtime.sendMessage({msg:Dharana.MSG_QT_TASKS}, function(taskList) {
		Dharana.dlog('Got task list: ' + JSON.stringify(taskList))
		$.each(taskList.activeTasks, function(idx, task) {
			createTaskListItem(task, "active").appendTo('#tasks')
		})

		$.each(taskList.startedTasks, function(idx, task) {
			createTaskListItem(task, "started").appendTo('#tasks')
		})
	})
})
