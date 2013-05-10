function TaskListCtrl($scope, $http) {
	$scope.tasks = []

	$http.get("/dharana/asana/tasks").success(function(dat, stat, xhr) {
		angular.forEach(dat.data, function(t) {
			$scope.tasks.push({name:t.name, completed:t.completed, id:t.id})
		})
	})

	$scope.setCompleted = function(scope, taskId, completed) {
		angular.forEach(scope.tasks, function(val,key) {
			if (val.id == taskId)
				scope.$apply(scope.tasks[key].completed = completed)
		})
	}

	$scope.icheck = function(tid) {
		var taskid = '#task' + tid
		$(taskid).iCheck({checkboxClass:'icheckbox_minimal-green', radioClass:'iradio_minimal-green'})
		$(taskid).on('ifChecked', function(e) { $scope.setCompleted($scope, tid, true) })
		$(taskid).on('ifUnchecked', function(e) { $scope.setCompleted($scope, tid, false) })
	}
}
