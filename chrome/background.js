function checkAsanaTask(tab) {
	console.log(tab.url)
	if (tab.url.substr(0,24) === "https://app.asana.com/0/")
		var asanaTaskUrl = tab.url.substr(24).split('/')
		var numInts = 0
		for (var i = 0; i < asanaTaskUrl.length; ++i) {
			asanaTaskUrl[i] = parseInt(asanaTaskUrl[i])
			if (!isNaN(asanaTaskUrl[i])) {
				++numInts
			}
		}

		if (asanaTaskUrl.length == numInts && numInts == 2) {
			chrome.pageAction.show(tab.id)
		}
}

chrome.tabs.onActivated.addListener(function(info) { chrome.tabs.get(info.tabId, checkAsanaTask) })
