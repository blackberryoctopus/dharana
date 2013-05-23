Dharana.Quicktime = {
	_tab_down_time: 0,
	_is_visible: false,
	_notification_element: null,
	_notification_message: null,
	_last_href: "",
	_autohide_timer: null,

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

		// Hide the notification panel after 3s if we showed it
		if (Dharana.Quicktime._is_visible) {
			Dharana.Quicktime._autohide_timer = setTimeout(function() {
				Dharana.dlog('Auto-hiding notification box')
				Dharana.Quicktime.setVisibility(false)
			}, 3000)
		}
	},

	friendlyTime: function(millis) {
		if (millis <= 90000) {
			return 'About a minute'
		} else if (millis > 90000 && millis < 3000000) {
			return Math.round(millis / 60000) + ' minutes'
		} else if (millis >= 3000000 && millis < 4200000) {
			return 'About an hour'
		} else if (millis >= 4200000) {
			return (millis / 3600000).toFixed(1) + ' hours'
		}
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

					// Ask the backend to toggle state on the currently
					// displayed task. Use the state/action code in the
					// backend's response to determine notification

					chrome.runtime.sendMessage({msg:Dharana.MSG_QT_TOGGLE, data:window.location.href},
						function(response) {
							Dharana.dlog('Got response from background ' + JSON.stringify(response))
							var notification = ""
							switch(response.action) {
								case 'started':
									if (response.time <= 0)
										notification = 'Started work on task.'
									else
										notification = 'Resumed work on task. ' + self.friendlyTime(response.time) + ' accumulated so far.'

									break
								case 'paused':
									notification = 'Paused work on task. ' + self.friendlyTime(response.time) + ' added.'
									break
							}

							Dharana.Quicktime._notification_message.textContent = notification
							self.toggleVisibility()
						})

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

		// Setup notification box

		var elem = document.createElement('div')
		elem.id = self.NOTIFICATION_ELEMENT_ID

		var msgElem = document.createElement('span')
		msgElem.id = self.NOTIFICATION_MSG_ID
		msgElem.textContent = 'Hello, World!'
		elem.appendChild(msgElem)

		Dharana.Quicktime._notification_element = elem
		Dharana.Quicktime._notification_message = msgElem

		document.body.appendChild(Dharana.Quicktime._notification_element)

		// Setup location change tracking so we can tell
		// when user switches to another task

		Dharana.Quicktime._last_href = window.location.href
		setInterval(function() {
			// Make sure to clear auto-hide timer if clearing 
			// notification on task change. Otherwise, the
			// auto-hide timer could hide a new notification

			if (window.location.href != Dharana.Quicktime._last_href) {

				if (Dharana.Quicktime._autohide_timer != null) {
					clearTimeout(Dharana.Quicktime._autohide_timer)
					Dharana.Quicktime._autohide_timer = null
				}

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
