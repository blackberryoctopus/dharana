var express = require('express')
var querystring = require('querystring')
var https = require('https')
var url = require('url')
var app = express()

tokens = {}

var time = new Date()

asanaRefreshToken = function(req, res, next, oldtok) {
	oldtok = (typeof oldtok == undefined) ? null : oldtok

	tokReqBody = {
		"grant_type": oldtok != null ? "refresh_token" : "authorization_code",
		"client_id":5313508784614,
		"client_secret":"f3054bf5395077756094bed77178ef1d",
		"redirect_uri":"https://nextstopgo.com/dharana/auth/"
	}

	if (oldtok != null) {
		console.log("Processing token refresh request")
		tokReqBody["refresh_token"] = oldtok['refresh_token']
	} else {
		var qry = url.parse(req.url, true)
		var code = qry.query['code']
		console.log("Processing new token request with code " + code)
		tokReqBody["code"] = code
	}

	tokReqBody = querystring.stringify(tokReqBody)

	tokReqOpts = {
		hostname: 'app.asana.com',
		path: '/-/oauth_token',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': tokReqBody.length
		}
	}
		
	tokReq = https.request(tokReqOpts, function(tokResp) {
		var dat = ""
		tokResp.on('data', function(chunk) { dat += chunk })

		tokResp.on('error', function() {
			res.end("Unexpected error trying to get Asana token")
		})

		tokResp.on('end', function() {
			console.log(dat)
			var asanaResp = JSON.parse(dat)
			console.log("Got Asana access token via API: " + asanaResp['access_token'])
			asanaResp['expiration'] = Date.now() + (asanaResp['expires_in'] * 1000)

			tokens[asanaResp['access_token']] = asanaResp
			req.asanaTok = asanaResp['access_token']
	
			if (oldtok != null)
				delete tokens[oldtok['access_token']]

			next()
		})
	})

	tokReq.end(tokReqBody)
}

asanaGetTasks = function(req, res, next) {
	taskReqOpts = {
		hostname: 'app.asana.com',
		path: '/api/1.0/projects/4743382492971/tasks?opt_fields=name,created_at,completed,completed_at,due_on',
		method: 'GET',
		headers: {
			'Authorization': "Bearer " + req.asanaTok
		}
	}

	taskReq = https.request(taskReqOpts, function(taskRes) {
		var data = ""
	
		taskRes.on('data', function(chunk) { data += chunk })

		taskRes.on('end', function() {
			var taskResObj = JSON.parse(data)
			req.asanaTasks = taskResObj
			next()
		})
	}).end()
}

asanaCheckToken = function(req, res, next) {
	var cookieTok = req.cookies['ccom_astok']
	var memTok = cookieTok != null ? tokens[cookieTok] : null

	if (memTok != null) {
		// Token must be current. Refresh if not.
		
		if (memTok['expiration'] >= Date.now()) {
			console.log("Got Asana access token from mem: " + memTok['access_token'])
			req.asanaTok = memTok['access_token']
			next()
		} else {
			console.log("Token expired. Refreshing")
			asanaRefreshToken(req, res, next, memTok)
		}
	} else {
		// Redirect user to Asana login if we can't find a
		// usable token

		var qstr = querystring.stringify({
			"client_id":5313508784614,
			"redirect_uri":"https://nextstopgo.com/dharana/auth/",
			"response_type":"code",
			"state":"auth"
		})

		var url = 'https://app.asana.com/-/oauth_authorize?' + qstr
		console.log("No Asana access token, starting authorization sequence")

		res.status(302)
		res.set('Location', url)
		res.end()
	}
}

app.enable('trust proxy')
app.use(express.cookieParser())
app.use('/dharana/static', express.static('static'))

// When done -- show "main screen"
app.get('/dharana/',
	asanaCheckToken,
	function(req, res) {
		//res.end(JSON.stringify(req.asanaTok))
		res.sendfile("static/tasklist.html")
	})


// For Asana OAuth authorization flow
app.get('/dharana/auth/',
	function(req, res, next) {
		asanaRefreshToken(req, res, next, null)
	},
	function(req, res) {
		res.status(302)
		res.cookie('ccom_astok', req.asanaTok)
		res.header('Location', 'https://nextstopgo.com/dharana/')
		res.end()
	})

// List Asana tasks
app.get('/dharana/asana/tasks',
	asanaCheckToken,
	asanaGetTasks,
	function(req, res) {
		res.end(JSON.stringify(req.asanaTasks, null, "  "))
	})


app.listen(7000)
