var currentTask = {}

$(window).load(function() {
	Dharana.LOGNAME = 'dharana-popup'
	Dharana.dlog("Requesting task data")
	chrome.runtime.sendMessage({msg:Dharana.MSG_QT_TASKS}, function(taskList) {
		Dharana.dlog('Got task list: ' + JSON.stringify(taskList))
		$.each(taskList.activeTasks, function(idx, task) {
			var taskListItem = $('<li>', {
				class: 'task-active',
			})

			var taskNameSpan = $('<span>', {text: task.name}).appendTo(taskListItem)
			var taskLinkSpan = $('<span>', {
				class: 'link'
			})

			var taskLinkIcon = $('<i>', {class: 'icon-chevron-right icon-white'}).appendTo(taskLinkSpan)
			taskLinkIcon.on('click', function(e) {
				chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
					if (tabs.length > 0) {
						chrome.tabs.update(tabs[0].id, {url: task.link})
					} else {
						Dharana.dlog("Couldn't get active tab")
					}
				})
			})

			taskLinkSpan.appendTo(taskListItem)

			taskListItem.appendTo('#tasks')
		})

		$.each(taskList.startedTasks, function(idx, task) {
			$('<li>', {
				class: 'task-started',
				text: task.name
			}).appendTo('#tasks')
		})
	})
})
