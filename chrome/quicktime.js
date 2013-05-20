Dharana.Quicktime = {
	_tab_down_time: 0,
	_is_visibile: false,
	_notification_element: null,
	_last_href: "",

	NOTIFICATION_ELEMENT_ID: 'dharana-notification',
	NOTIFICATION_MSG_ID: 'dharana-notification-mesage',

	setVisibility: function(visible) {
		if (Dharana.Quicktime._is_visible != visible) {
			if (visible) {
				Dharana.dlog('Setting notification box to visible')
				Dharana.Quicktime._notification_element.style.visibility = 'visible'
			} else {
				Dharana.dlog('Setting notification box to hidden')
				Dharana.Quicktime._notification_element.style.visibility = 'hidden'
			}

			Dharana.Quicktime._is_visible = visible
		}
	},

	toggleVisibility: function() {
		Dharana.Quicktime.setVisibility(!Dharana.Quicktime._is_visible)
	},

	keyDown: function(e) {
		var self = Dharana.Quicktime
		if (e.keyCode === 17) {
			self._tab_down_time = new Date().getTime()
		} else if (e.keyCode === 83) {
			if (new Date().getTime() < self._tab_down_time + 1000) {
				// On Tab+S, check that we are on a specific task

				var matches = /^https:\/\/app\.asana\.com\/0\/([0-9]+)\/([0-9]+)/.exec(window.location.href)
				if (matches && matches.length == 3 && matches[1] != matches[2]) {
					self._tab_down_time = 0
					self.toggleVisibility()
					e.preventDefault()
					return false
				} else {
					Dharana.dlog('Tab+S invoked but not on a task')
				}
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

		Dharana.Quicktime._last_href = window.location.href
		setInterval(function() {
			if (window.location.href != Dharana.Quicktime._last_href) {
				Dharana.dlog('Detected task change, hiding notifications: ' + window.location.href + " / " + Dharana.Quicktime._last_href)
				Dharana.Quicktime._last_href = window.location.href
				Dharana.Quicktime.setVisibility(false)
			}
		}, 250)
	},

	listen: function() {
		Dharana.dlog('Setting up notification element')
		Dharana.Quicktime.setup()
		Dharana.dlog('Listening for quicktime hotkey on ' + window.location.href)
		window.addEventListener('keydown', Dharana.Quicktime.keyDown, true)
		window.addEventListener('keyup', Dharana.Quicktime.keyUp, true)
	}
}

Dharana.LOGNAME = 'dharana-quicktime'
Dharana.dlog('Injected')
Dharana.Quicktime.listen()
