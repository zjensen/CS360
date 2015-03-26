angular.module('weatherNews', ['ui.router'])
.controller('MainCtrl', ['$scope','postFactory',
	function($scope, postFactory)
	{
		$scope.posts = postFactory.posts;
		$scope.incrementUpvotes = function(post) 
		{
			post.upvotes += 1;
		};
		$scope.addPost = function() 
		{
			$scope.posts.push({title:$scope.formContent,upvotes:0});
			$scope.formContent='';
		};
	}
])
.controller('PostCtrl', [
  '$scope',
  '$stateParams',
  'postFactory', 
  function($scope, $stateParams, postFactory){
    $scope.post = postFactory.posts[$stateParams.id];
    $scope.addComment = function(){
      if($scope.body === '') { return; }
      $scope.post.comments.push({
        body: $scope.body,
        upvotes: 0
      });
      $scope.body = '';
    };
  $scope.incrementUpvotes = function(comment){
    comment.upvotes += 1; 
  };
}])

.factory('postFactory', [function(){
  var o = {
    posts: []
  };
  return o;
}])

.config([
  '$stateProvider',
  '$urlRouterProvider',
  '$locationProvider',
  function($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl'
      })
      .state('posts', {
        url: '/posts/{id}',
        templateUrl: '/posts.html',
        controller: 'PostCtrl'
      });
    $urlRouterProvider.otherwise('home');
    $locationProvider.html5Mode(true);
}])