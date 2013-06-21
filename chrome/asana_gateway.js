function AsanaGateway() {
	this.rateLimit = 80 / 60000  // Default rate (req/ms) = 100 req / min
	this.tokenLimit = 80
	this.tokenCount = 80
	this.lastRequestTime = Date.now()
	this.endpoint = 'https://app.asana.com/api/1.0'
	this.queuedTasks = 0
}

AsanaGateway.prototype.request = function(req, callback, data) {
	if (this.tokenCount < this.tokenLimit) {
		var earnedTokens = (Date.now() - this.lastRequestTime) * this.rateLimit
		var updatedTokens = this.tokenCount + earnedTokens
		this.tokenCount = updatedTokens > this.tokenLimit ? this.tokenLimit : updatedTokens
		this.lastRequestTime = Date.now()
	}

	if (this.tokenCount >= 1) {
		this.tokenCount -= 1

		if (data) {
			// POST request
			$.post(this.endpoint + req, {"text":data}, function(data, status, xhr) {
					callback(data)
				}, "json")
		} else {
			// GET request
			$.getJSON(this.endpoint + req, function(data) {
				callback(data)
			})
		}	
	} else {
		var waitTime = (1 / this.rateLimit) * (this.queuedTasks + 1)
		Dharana.dlog('Rate limit reached. Bucket has ' + this.tokenCount + ' tokens. Waiting ' + waitTime + ' ms with ' + this.queuedTasks + ' tasks in the queue.')

		var self = this
		setTimeout(function() {
			self.queuedTasks -= 1
			self.request(req, callback, data)
		}, waitTime)
		this.queuedTasks += 1
	}

	Dharana.dlog('bucket ended with ' + this.tokenCount + ' tokens')
}
