function TaskListCtrl($scope, $http) {
	$scope.tasks = []
	$http.get("/dharana/asana/tasks").success(function(dat, stat, xhr) {
		angular.forEach(dat.data, function(t) {
			$scope.tasks.push({name:t.name, completed:t.completed, id:t.id})
		})
	})

	$scope.icheck = function(i) {
		var taskid = '#task' + $scope.tasks[i].id
		$(taskid).iCheck({checkboxClass:'icheckbox_minimal-green', radioClass:'iradio_minimal-green'})
	}

}
