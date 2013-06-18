var currentTask = {}

function setupDetailPanel(task) {
	var taskNameSpan = $("#taskdetail-panel > #taskdetail-name > #taskname")
	taskNameSpan.text(task.name)

	var taskLink = $("#taskdetail-panel > #taskdetail-name > span.link > i")
	taskLink.unbind('click')
	taskLink.click(function(e) { showTaskListPanel() })
}

function showDetailPanel(task) {
	setupDetailPanel(task)
	$("#tasklist-panel").css('display', 'none')
	$("#taskdetail-panel").css('display', 'block')
}

function showTaskListPanel() {
	$("#taskdetail-panel").css('display', 'none')
	$("#tasklist-panel").css('display', 'block')
}

function createTaskListItem(task, taskState) {
	var taskClass = ''
	switch(taskState) {
		case "active":
			taskClass = 'task-active'
			break
		case "started":
			taskClass = 'task-started'
			break
		case "current":
			taskClass = 'task-current'
			break
	}

	var taskListItem = $('<li>', {
		class: taskClass,
		title: task.name
	})

	taskListItem.hover(
		function(evt) {
			Dharana.dlog('hover in on task ' + task.id)
			$('ul.tasklist > li > span#' + task.id).css('visibility', 'visible')
		},
		function(evt) {
			Dharana.dlog('hover out on task ' + task.id)
			$('ul.tasklist > li > span#' + task.id).css('visibility', 'hidden')
		})

	var taskNameSpan = $('<div>', {class: 'taskname', text: task.name}).appendTo(taskListItem)
	var taskLinkSpan = $('<span>', {
		class: 'link',
		id: task.id
	})

	var taskDetailIcon = $('<i>', {class: 'icon-adjust icon-white rpad'}).appendTo(taskLinkSpan)
	taskDetailIcon.click(function(evt) {
		showDetailPanel(task)
	})

	var taskLinkIcon = $('<i>', {class: 'icon-chevron-right icon-white'}).appendTo(taskLinkSpan)
	taskLinkIcon.click(function(evt) {
		chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
			if (tabs.length > 0) {
				chrome.tabs.update(tabs[0].id, {url: task.link})
				window.close()
			} else {
				Dharana.dlog("Couldn't get active tab")
			}
		})
	})

	taskLinkSpan.appendTo(taskListItem)

	return taskListItem
}

function populateTaskLists() {

	var currentTaskId = null
	chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
		var tab = tabs[0]
		var currentTaskId = null
		var taskUrlComponents = asanaTaskPattern.exec(tab.url)

		if (taskUrlComponents && taskUrlComponents.length == 3 && taskUrlComponents[1] != taskUrlComponents[2]) {
			currentTaskId = taskUrlComponents[2]
			Dharana.dlog('Current task id is ' + currentTaskId)
		}

		Dharana.dlog("Requesting task data")
		chrome.runtime.sendMessage({msg:Dharana.MSG_QT_TASKS, curr:currentTaskId}, function(taskList) {
			Dharana.dlog('Got task list: ' + JSON.stringify(taskList))

			var listedCurrentTask = false

			if (taskList.activeTasks.length > 0 || taskList.startedTasks.length > 0) {
				// TODO check if currentTask is defined
				// TODO make this loop a function to eliminate repetition in 2nd loop below

				$.each(taskList.activeTasks, function(idx, task) {
					createTaskListItem(task, "active").appendTo('#tasks')
					if (task.id == taskList.currentTask.id) {
						listedCurrentTask = true
					}
				})

				$.each(taskList.startedTasks, function(idx, task) {
					createTaskListItem(task, "started").appendTo('#tasks')
					if (task.id == taskList.currentTask.id) {
						listedCurrentTask = true
					}
				})
			} else {
				$("#no-items").css('display', 'block')
			}

			if (!listedCurrentTask && taskList.currentTask != null) {
				createTaskListItem(taskList.currentTask, "current").appendTo('#activetask')
			}
		})
	})
}

function setupSpentTimeMeter(timeFragData) {
	var displayedPct = timeFragData.active / (timeFragData.end - timeFragData.start) * 100.0 + '%'

	$("#spent-meter > div.meter-active").css({
		left: "0px",
		width: displayedPct
	})
}

function setupLoggedTimeMeter(timeFragData) {
	$.each(timeFragData.data, function(idx, fragment) {
		var activePeriod = timeFragData.end - timeFragData.start
		var blockPct = (fragment.end - fragment.start) / activePeriod * 100.0 + '%'
		var blockStart = (fragment.start - timeFragData.start) / activePeriod * 100.0 + '%'

		$('<div>', {
			class: "meter-active meter-active-block",
			style: "left:" + blockStart + "; width:" + blockPct + ";"
		}).appendTo('#block-meter')
	})
}

function populateActivityMeters() {
	Dharana.dlog("Requesting time fragmentation data")
	chrome.runtime.sendMessage({msg:Dharana.MSG_QT_FRAGMENTATION}, function(timeFragData) {
		Dharana.dlog('Got time fragmentation data: ' + JSON.stringify(timeFragData))
		setupSpentTimeMeter(timeFragData)
		setupLoggedTimeMeter(timeFragData)

		$("#meter-holder").hover(
			function(inevt) {
				$("#spent-meter").css('display', 'none')
				$("#block-meter").css('display', 'block')
			},
			function(outevt) {
				$("#spent-meter").css('display', 'block')
				$("#block-meter").css('display', 'none')
			})

		if (timeFragData.active > 0) {
			$("#spent-meter > .meter-text").text(Dharana.friendlyTime(timeFragData.active))
			$("#spent-meter").css('display', 'block')
		}
	})
}

$(window).load(function() {
	Dharana.LOGNAME = 'dharana-popup'
	populateTaskLists()
	populateActivityMeters()
})
