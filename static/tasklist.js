function TaskListCtrl($scope, $http) {
	$scope.tasks = []
	$http.get("/dharana/asana/tasks").success(function(dat, stat, xhr) {
		angular.forEach(dat.data, function(t) {
			console.log(t.name)
			$scope.tasks.push({name:t.name, completed:t.completed})
		})
	})
}
