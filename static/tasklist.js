angular.module('Dharana', []).filter('complete', function() {
	return function(tid) {
		console.log("Got task " + tid)
		return true
	}
})

function TaskListCtrl($scope, $http) {
	$scope.currentWorkspace = null

	$scope.taskIds = []
	$scope.tasks = {}
	$scope.workspaceIds = []
	$scope.workspaces = {}
	$scope.projectsInWorkspace = []
	$scope.projects = {}

	$http.get("/dharana/asana/tasks").success(function(dat, stat, xhr) {
		angular.forEach(dat.data, function(t) {
			$scope.taskIds.push(t.id)
			$scope.tasks[t.id] = t
		})
	})

	$http.get("/dharana/asana/workspaces").success(function(dat, stat, xhr) {
		angular.forEach(dat.data, function(t) {
			$scope.workspaceIds.push(t)
			$scope.workspaces[t.id] = t
		})
	})

	$http.get("/dharana/asana/projects").success(function(dat, stat, xhr) {
		angular.forEach(dat.data, function(t) {
			$scope.projects[t.id] = t
		})
	})

	$scope.setCompleted = function(scope, taskId, completed) {
		angular.forEach(scope.tasks, function(val,key) {
			if (val.id == taskId)
				scope.$apply(scope.tasks[key].completed = completed)
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
			angular.forEach($scope.projects, function(prj) {
				if (prj.workspace.id == wid) {
					$scope.projectsInWorkspace.push(prj.id)
					console.log("project ID " + prj.id + " is in workspace " + wid)
				}
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
