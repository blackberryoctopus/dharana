function AsanaGateway() {
	this.asanaLimit = 75 // Default rate (req/ms) = 90 req / min
	this.rateLimit = this.asanaLimit / 60000  
	this.tokenLimit = this.asanaLimit
	this.tokenCount = this.asanaLimit
	this.lastRequestTime = Date.now()
	this.endpoint = 'https://app.asana.com/api/1.0'
	this.queuedTasks = 0
}

AsanaGateway.prototype.request = function(req, callback, data) {
	var self = this

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
			}).fail(function(xhr, textStatus, errMsg) {
				Dharana.dlog('Asana request failed with status code ' + xhr.status)
				switch (xhr.status) {
					case 429:
						var retryTimeout = xhr.getResponseHeader('Retry-After')
						Dharana.dlog('Retrying request ' + req + ' in ' + retryTimeout + 's')
						setTimeout(function() { self.request(req, callback, data) }, retryTimeout * 1000)
						break
				}
			})
		}	
	} else {
		var waitTime = (1 / this.rateLimit) * (this.queuedTasks + 1)
		Dharana.dlog('Rate limit reached. Bucket has ' + this.tokenCount + ' tokens. Waiting ' + waitTime + ' ms with ' + this.queuedTasks + ' tasks in the queue.')

		setTimeout(function() {
			self.queuedTasks -= 1
			self.request(req, callback, data)
		}, waitTime)
		this.queuedTasks += 1
	}

	Dharana.dlog('bucket ended with ' + this.tokenCount + ' tokens')
}
