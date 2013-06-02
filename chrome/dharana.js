Dharana = {
	EXTENSIONID: 'dharana_chrome',
	LOGNAME: 'dharana-unknown',

	MSG_QT_TOGGLE: 'dharana.quicktime.toggle',
	MSG_QT_LASTTASK: 'dharana.quicktime.last_active_task',
	MSG_QT_TASKS: 'dharana.quicktime.tasks',
	MSG_QT_FRAGMENTATION: 'dharana.quicktime.fragmentation',

	ERR_NOTASK: 'dharana.quicktime.notask',

	TASKSTATE_COMPLETED: 0,
	TASKSTATE_ONHOLD: 1,
	TASKSTATE_ACTIVE: 2,
	TASKSTATE_DEFAULT: 3,
	
	dlog: function(str) {
		self = Dharana
		console.log('[' + self.LOGNAME + '] ' + str)
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
	}
}
