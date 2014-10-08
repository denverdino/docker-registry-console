angular.module('myImage', [])
    .factory('dockerRegistryService', ['$http', function($http) {
        var dockerRegistryService = {
            retrieveRepoInfo: function(repo) {
                return $http(
                    {
                        method: 'GET',
                        url: '/resources/registries/public/' + repo + '/info'
                    }).then(function (response){
                        return response.data
                    }, function(response){
                        return null;
                    });
            }
        };
        return dockerRegistryService;
    }])
    .controller('imageInfoController', ['$scope', 'dockerRegistryService', function ($scope, dockerRegistryService) {
        $scope.repository = {};
        $scope.isReady = false;
        $scope.hasResult = false;
        $scope.status = 'unknown';
        //Initialize
        dockerRegistryService.retrieveRepoInfo($scope.repoName).then(function(result) {
            $scope.repository = result;
            $scope.status = 'invalid';
            var tags = [];
            if (result != null) {
                var repoURL = ($scope.repoName.indexOf('/') >= 0)? 'u/' + $scope.repoName : '_/' + $scope.repoName;
                $scope.repository.url = 'https://registry.hub.docker.com/' + repoURL + '/';
                $scope.status = 'not_found';
                for (var i = 0, len = result.images.length; i < len; i ++) {
                    var image = result.images[i];
                    if (image.id = $scope.imageId) {
                        $scope.status = 'found';
                    }
                    if (image.tags) {
                        for (var j = 0, n = image.tags.length; j < n; j++) {
                            var tag = image.tags[j];
                            if (tag === $scope.tag) {
                                $scope.status = 'matched';
                            }
                            tags.push(tag);
                        }
                    }
                }
                $scope.hasResult = true;
            }
            $scope.isReady = true;
            $scope.repository.tags = tags;
        });

    }]);
