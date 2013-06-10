function DharanaQuicktime() {
	this.tm_ctrl = 0
	this.tm_fkey = 0

	this.notification_element = null
	this.notification_message = null

	this.last_href = null
	this.autohide_timer = null
	this.is_visible = false

	Dharana.LOGNAME = 'dharana-quicktime'
	this.setup()
}

DharanaQuicktime.prototype.keycode_ctrl = 17       // ctrl
DharanaQuicktime.prototype.keycode_fkey = 83       // s
DharanaQuicktime.prototype.keycode_start = 83      // s
DharanaQuicktime.prototype.keycode_log = 76        // l
DharanaQuicktime.prototype.keycode_correct = 67    // c

DharanaQuicktime.prototype.NOTIFICATION_ELEMENT_ID = 'dharana-notification'
DharanaQuicktime.prototype.NOTIFICATION_MSG_ID = 'dharana-notification-mesage'

DharanaQuicktime.prototype.setVisibility = function(visible) {
	if (this.is_visible != visible) {
		if (visible) {
			Dharana.dlog('Setting notification box to visible')
			this.notification_element.style.visibility = 'visible'
		} else {
			Dharana.dlog('Setting notification box to hidden')
			this.notification_element.style.visibility = 'hidden'
		}

		this.is_visible = visible
	}
}

DharanaQuicktime.prototype.toggleVisibility = function() {
	this.setVisibility(!this.is_visible)

	// Hide the notification panel after 3s if we showed it
	if (this.is_visible) {
		var self = this
		this.autohide_timer = setTimeout(function() {
			Dharana.dlog('Auto-hiding notification box')
			self.setVisibility(false)
		}, 3000)
	}
}

DharanaQuicktime.prototype.setup = function() {
	Dharana.dlog('Setting up notification element')

	// Setup notification box
	var elem = document.createElement('div')
	elem.id = this.NOTIFICATION_ELEMENT_ID

	var msgElem = document.createElement('span')
	msgElem.id = this.NOTIFICATION_MSG_ID
	msgElem.textContent = 'Hello, World!'
	elem.appendChild(msgElem)

	this.notification_element = elem
	this.notification_message = msgElem

	document.body.appendChild(this.notification_element)

	// Setup location change tracking so we can tell
	// when user switches to another task

	this.last_href = window.location.href
	var qtobj = this
	setInterval(function() {
		// Make sure to clear auto-hide timer if clearing 
		// notification on task change. Otherwise, the
		// auto-hide timer could hide a new notification

		if (window.location.href != qtobj.last_href) {

			if (this.autohide_timer != null) {
				clearTimeout(qtobj.autohide_timer)
				qtobj.autohide_timer = null
			}

			Dharana.dlog('Detected task change, hiding notifications: ' + window.location.href + " / " + qtobj.last_href)
			qtobj.last_href = window.location.href
			qtobj.setVisibility(false)
		}
	}, 250)
}

DharanaQuicktime.prototype.keyDownHandler = function(e) {
	if (e.keyCode === this.keycode_ctrl) {
		Dharana.dlog("Got ctrl key")
		this.tm_ctrl = new Date().getTime()
	} else if (e.keyCode === this.keycode_fkey) {
		if (new Date().getTime() < this.tm_ctrl + 1000) {
			Dharana.dlog("Got s key")
			// On Tab+S, check that we are on a specific task

			var matches = /^https:\/\/app\.asana\.com\/0\/([0-9]+)\/([0-9]+)/.exec(window.location.href)
			if (matches && matches.length == 3 && matches[1] != matches[2]) {
				this.tm_ctrl = 0

				// Ask the backend to toggle state on the currently
				// displayed task. Use the state/action code in the
				// backend's response to determine notification

				var self = this

				chrome.runtime.sendMessage({msg:Dharana.MSG_QT_TOGGLE, data:window.location.href},
					function(response) {
						Dharana.dlog('Got response from background ' + JSON.stringify(response))
						var notification = ""
						switch(response.action) {
							case 'started':
								if (response.time <= 0)
									notification = 'Started work on task.'
								else
									notification = 'Resumed work on task. ' + Dharana.friendlyTime(response.time) + ' accumulated so far.'

								break
							case 'paused':
								notification = 'Paused work on task. ' + Dharana.friendlyTime(response.time) + ' added.'
								break
						}

						self.notification_message.textContent = notification
						self.toggleVisibility()
					})

				e.preventDefault()
				return false
			} else {
				Dharana.dlog('Tab+S invoked but not on a task')
			}
		}
	}
}

DharanaQuicktime.prototype.keyUpHandler = function(e) {
	if (e.keyCode === this.keycode_ctrl) {
		this.tm_ctrl = 0
	}
}

var _dharana_qt = new DharanaQuicktime()
window.addEventListener('keydown', function(e) { _dharana_qt.keyDownHandler(e) }, true)
window.addEventListener('keyup', function(e) { _dharana_qt.keyUpHandler(e) }, true)

Dharana.dlog('Injected')
