angular.module('Dharana', []).filter('complete', function() {
	return function(tid) {
		console.log("Got task " + tid)
		return true
	}
})

function TaskListCtrl($scope, $http) {
	$scope.currentWorkspace = null
	$scope.currentProject = null

	$scope.activeTasks = []

	$scope.taskIds = []
	$scope.tasks = {}
	$scope.workspaceIds = []
	$scope.workspaces = {}
	$scope.projectsInWorkspace = []
	$scope.projects = {}

	$http.get("/dharana/asana/workspaces").success(function(dat, stat, xhr) {
		angular.forEach(dat.data, function(t) {
			$scope.workspaceIds.push(t.id)
			$scope.workspaces[t.id] = t
		})

		$http.get("/dharana/asana/projects").success(function(dat, stat, xhr) {
			angular.forEach(dat.data, function(t) {
				$scope.projects[t.id] = t
			})

			if ($scope.workspaceIds.length > 0) {
				$scope.setWorkspace($scope.workspaceIds[0])
			}
		})
	})


	$scope.setCompleted = function(scope, taskId, completed) {
		angular.forEach(scope.tasks, function(val,key) {
			if (val.id == taskId)
				scope.$apply(scope.tasks[key].completed = completed)
		})
	}

	$scope.getTaskTags = function(tid) {
	}

	$scope.taskDetailPopover = function(tid) {
		var taskTagId = "taskDetailTags" + tid

		$("#tasklabel" + tid).popover({
			html: true,
			placement: "bottom",
			trigger: "hover",
			delay: {show:300, hide:200},
			title: 'Task Detail',
			content: function() {
				var taskTagId = "taskTagPopover" + tid
				$http.get("/dharana/asana/tasks/" + tid + "/tags").success(function(dat, stat, xhr) {
					var html = ""

					angular.forEach(dat.data, function(tag) {
						html = html + ' <span class="label">' + tag.name + '</span>'
					})

					$('#' + taskTagId).html(html)
				})

				return '<span id="' + taskTagId + '"></span>'
			}
		})
	}

	$scope.taskIdsByCompletion = function(state) {
		var completed = []
		angular.forEach($scope.tasks, function(val) {
			if (val.completed == state)
				completed.push(val.id)
		})
		return completed
	}

	$scope.setWorkspace = function(wid) {
			$scope.currentWorkspace = wid
			$scope.projectsInWorkspace = []

			$('#workspace-name').text($scope.workspaces[wid].name)

			angular.forEach($scope.projects, function(prj) {
				if (prj.workspace.id == wid) {
					$scope.projectsInWorkspace.push(prj.id)
				}
			})

			if ($scope.projectsInWorkspace.length > 0) {
				$scope.setProject($scope.projectsInWorkspace[0])
			}
	}

	$scope.setProject = function(pid) {
			$scope.currentProject = pid
			$scope.tasks = {}
			$scope.taskIds = []
			$scope.activeTasks = []

			$('#project-name').text($scope.projects[pid].name)

			$http.get("/dharana/asana/projects/" + pid + "/tasks").success(function(dat, stat, xhr) {
				angular.forEach(dat.data, function(t) {
					$scope.taskIds.push(t.id)
					$scope.tasks[t.id] = t
				})

				$scope.activeTasks = $scope.taskIdsByCompletion(false)
			})
	}

	$scope.dropdown = function() {
		$('.dropdown-toggle').dropdown()
	}

	$scope.icheck = function(tid) {
		var taskid = '#task' + tid
		$(taskid).iCheck({checkboxClass:'icheckbox_square'})
		$(taskid).on('ifChecked', function(e) { $scope.setCompleted($scope, tid, true) })
		$(taskid).on('ifUnchecked', function(e) { $scope.setCompleted($scope, tid, false) })
	}
}
