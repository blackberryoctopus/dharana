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
		class: taskClass,
		title: task.name
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
	Dharana.dlog("Requesting task data")
	chrome.runtime.sendMessage({msg:Dharana.MSG_QT_TASKS}, function(taskList) {
		Dharana.dlog('Got task list: ' + JSON.stringify(taskList))
		if (taskList.activeTasks.length > 0 || taskList.startedTasks.length > 0) {
			$.each(taskList.activeTasks, function(idx, task) {
				createTaskListItem(task, "active").appendTo('#tasks')
			})

			$.each(taskList.startedTasks, function(idx, task) {
				createTaskListItem(task, "started").appendTo('#tasks')
			})
		} else {
			$("#no-items").css('display', 'block')
		}
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
