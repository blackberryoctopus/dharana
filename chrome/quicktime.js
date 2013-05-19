Dharana.Quicktime = {
	_tab_down_time: 0,
	_is_visibile: false,
	_notification_element: null,
	NOTIFICATION_ELEMENT_ID: 'dharana-notification',
	NOTIFICATION_MSG_ID: 'dharana-notification-mesage',

	toggleVisibility: function() {
		if (Dharana.Quicktime._is_visible) {
			Dharana.dlog('Toggling from visible -> invisible')
			Dharana.Quicktime._notification_element.style.visibility = 'hidden'
		} else {
			Dharana.dlog('Toggling from invisible -> visible')
			Dharana.Quicktime._notification_element.style.visibility = 'visible'
		}

		Dharana.Quicktime._is_visible = !Dharana.Quicktime._is_visible
	},

	keyDown: function(e) {
		var self = Dharana.Quicktime
		if (e.keyCode === 17) {
			self._tab_down_time = new Date().getTime()
		} else if (e.keyCode === 83) {
			if (new Date().getTime() < self._tab_down_time + 1000) { // Tab+s 
				self._tab_down_time = 0
				/*
				chrome.runtime.sendMessage(Dharana.EXTENSIONID, {type:Dharana.MSG_QT_TOGGLE, url:window.location.href}, function(task, state) {
					Dharana.dlog('Task ID ' + task.id + ' now ' + state)
				})
				*/

				self.toggleVisibility()
				e.preventDefault()
				return false
			}
		}
	},

	keyUp: function(e) {
		var self = Dharana.Quicktime
		if (e.keyCode === 17) {
			self._tab_down_time = 0
		}
	},

	setup: function() {
		self = Dharana.Quicktime

		var elem = document.createElement('div')
		elem.id = self.NOTIFICATION_ELEMENT_ID

		var msgElem = document.createElement('span')
		msgElem.id = self.NOTIFICATION_MSG_ID
		msgElem.textContent = 'Hello, World!'
		elem.appendChild(msgElem)
		
		Dharana.Quicktime._notification_element = elem
		document.body.appendChild(self._notification_element)
	},

	listen: function() {
		if (/^https:\/\/app\.asana\.com/.test(window.location.href)) {
			Dharana.dlog('Setting up notification element')
			Dharana.Quicktime.setup()
			Dharana.dlog('Listening for quicktime hotkey on ' + window.location.href)
			window.addEventListener('keydown', Dharana.Quicktime.keyDown, true)
			window.addEventListener('keyup', Dharana.Quicktime.keyUp, true)
		}
	}
}

Dharana.LOGNAME = 'dharana-quicktime'
Dharana.dlog('Injected')
Dharana.Quicktime.listen()
