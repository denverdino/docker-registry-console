function handleSearchRequest($scope, dockerRegistryService, searchFunc) {
    var pageSize = 10;

    $scope.totalItems = 0;
    $scope.maxSize = 10;
    $scope.isReady = false;

    $scope.search = function () {
        $scope.isReady = false;
        dockerRegistryService[searchFunc]($scope.searchTerm).then(function(items) {
            $scope.isReady = true;
            $scope.allItems = angular.copy(items);
            $scope.pagination(items, pageSize);
            $scope.pageChanged();
        }, function() {
            $scope.isReady = true;
        });
    };

    $scope.setPage = function (pageNo) {
        $scope.currentPage = pageNo;
    };

    $scope.pageChanged = function() {
        $scope.items = $scope.itemsByPage[$scope.currentPage - 1];
    };

    $scope.pagination = function (items, pageSize) {
        var arrays = [], size = pageSize;
        $scope.totalItems = items.length;
        $scope.currentPage = 1;

        if (items.length == 0) {
            arrays.push([]);
        } else {
            while (items.length > 0) {
                arrays.push(items.splice(0, size));
            }
        }
        $scope.itemsByPage = arrays;
        $scope.numPages = arrays.length;
    };

    //Initialize
    $scope.search();
}

angular.module('homepage', ['ui.bootstrap'])
    .factory('dockerRegistryService', ['$http', function($http) {
        var dockerRegistryService = {
            searchImages: function(searchTerm) {
                var queryString = (searchTerm && searchTerm.length > 0)? '?q=' + encodeURIComponent(searchTerm) : '';
                return $http(
                    {
                        method: 'GET',
                        url: '/resources/registries/private/images' + queryString
                    }).then(function (response){
                        return response.data
                    });
            },
            searchRepositories: function(searchTerm) {
                var queryString = (searchTerm && searchTerm.length > 0)? '?q=' + encodeURIComponent(searchTerm) : '';
                return $http(
                    {
                        method: 'GET',
                        url: '/resources/registries/public/repositories/' + queryString
                    }).then(function (response){
                        return response.data
                    });
            }
         };
        return dockerRegistryService;
    }])
    .controller('imagesController', ['$scope', 'dockerRegistryService', function($scope, dockerRegistryService) {
        handleSearchRequest($scope, dockerRegistryService, 'searchImages');
    }])
    .controller('repositoriesController', ['$scope', 'dockerRegistryService', function($scope, dockerRegistryService) {
        handleSearchRequest($scope, dockerRegistryService, 'searchRepositories');
    }]);
