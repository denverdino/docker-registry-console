angular.module('myApp', ['ui.bootstrap'])
    .factory('dockerRegistryService', ['$http', function($http) {
        var dockerRegistryService = {
            query: function(searchTerm) {
                var queryString = (searchTerm && searchTerm.length > 0)? '?q=' + encodeURIComponent(searchTerm) : '';
                return $http(
                    {
                        method: 'GET',
                        url: '/resources/tags' + queryString
                    }).then(function (response){
                        return response.data
                    });
            }
         };
        return dockerRegistryService;
    }])
    .controller('imagesController', ['$scope', 'dockerRegistryService', function ($scope, dockerRegistryService) {
        var pageSize = 10;

        $scope.search = function () {
            dockerRegistryService.query($scope.searchTerm).then(function(items) {
                $scope.allItems = angular.copy(items);
                $scope.pagination(items, pageSize);
                $scope.pageChanged();
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
    }]);
