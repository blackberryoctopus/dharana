function DharanaTask(asanaTask) {
	this.id = asanaTask.id
	this.name = asanaTask.name
	this.completed = asanaTask.completed
	this.completed_at = asanaTask.completed_at
	this.timeBlocks = {}
	this.lastTxId = -1
	this.lastUrl = null
}

DharanaTask.prototype.getState = function() {
	/*
	On hold:  work logged, but not marked completed
	Active:   work ongoing
	Default:  no work logged
   */

	if (!$.isEmptyObject(this.timeBlocks) && this.timeBlocks[this.lastTxId].end != undefined) {
		return Dharana.TASKSTATE_ONHOLD
	} else if (!$.isEmptyObject(this.timeBlocks) && this.timeBlocks[this.lastTxId].end == undefined) {
		return Dharana.TASKSTATE_ACTIVE
	} else {
		return Dharana.TASKSTATE_DEFAULT
	}
}

DharanaTask.prototype.addEvent = function(txid, evt_type, evt_tm) {
	var evt_block = this.timeBlocks[txid] || {txid:txid, start:undefined, end:undefined}

	switch (evt_type) {
		case 'start':
			evt_block.start = evt_tm
			break
		case 'end':
			evt_block.end = evt_tm
			break
	}

	this.timeBlocks[txid] = evt_block
	this.lastTxId = txid > this.lastTxId ? txid : this.lastTxId
}

DharanaTask.prototype.timeSpent = function() {
	var tm_spent = 0
	$.each(this.timeBlocks, function(txid, block) {
		if (block.start != undefined && block.end != undefined) {
			tm_spent += (block.end - block.start)
		}
	})

	return tm_spent
}
