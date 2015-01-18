function handleSearchRequest($scope, dockerRegistryService, searchFunc) {
    var pageSize = 15;
    $scope.pageSize = pageSize;
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

function handlePullImage($scope, $modal, dockerRegistryService) {
    $scope.openPullingDialog = function (image, tag) {
        dockerRegistryService.pullImage(image, tag);
        var modalInstance = $modal.open({
            templateUrl: 'pullImageDialog.html',
            controller: 'pullImageDialogController',
            ///size: 'sm',
            resolve: {
                image: function () {
                    return image + ":" + tag;
                }
            }
        });
    };
}


angular.module('registry_console', ['ui.bootstrap'])
    .factory('dockerRegistryService', ['$http', function($http) {
        var dockerRegistryService = {
            listRepoTags: function(registry, repo) {
                return $http(
                    {
                        method: 'GET',
                        url: '/resources/registries/' + registry + '/repositories/' + repo + '/details'
                    }).then(function (response){
                        return response.data
                    }, function(response){
                        return null;
                    });
            },
            retrieveRepoInfo: function(repo) {
                return $http(
                    {
                        method: 'GET',
                        url: '/resources/registries/public/repositories/' + repo + '/info'
                    }).then(function (response){
                        return response.data
                    }, function(response){
                        return null;
                    });
            },
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
            },
            pullImage: function(image, tag) {
                return $http(
                    {
                        method: 'POST',
                        url: '/resources/registries/private/repositories/' + image + '/tags/' + tag
                    }).then(function (response){
                        return response.data
                    });
            },
            deleteRepoTag: function(image, tag) {
                return $http(
                    {
                        method: 'DELETE',
                        url: '/resources/registries/private/repositories/' + image + '/tags/' + tag
                    }).then(function (response){
                        return response.data
                    });
            }
        };
        return dockerRegistryService;
    }])
    .controller('repositoryTagsController', ['$scope', '$modal', 'dockerRegistryService', function ($scope, $modal, dockerRegistryService) {
        var selectedTag = $scope.selectedTag;
        if (!selectedTag || "" === selectedTag || "undefined" === selectedTag) {
            selectedTag = 'latest';
        }
        console.log("selectedTag=" + selectedTag);
        $scope.tagsInfo = [];
        $scope.isReady = false;
        $scope.hasResult = false;
        //Initialize
        dockerRegistryService.listRepoTags($scope.registry, $scope.repoName).then(function(details) {
            var tagsInfo = details.tags;
            var repoURL = (details.name.indexOf('/') >= 0)? 'u/' + details.name : '_/' + details.name;
            details.url = 'https://registry.hub.docker.com/' + repoURL + '/';

            for (var i = 0; i < tagsInfo.length; i ++) {
                var image = tagsInfo[i];
                image.isSelected = (image.tag === selectedTag);
                if (image.config) {
                    if (image.config.ExposedPorts) {
                        var portsInfo = [];
                        for (var port in image.config.ExposedPorts) {
                            var portInfo = port.split('/');
                            portsInfo.push ({
                                port: portInfo[0],
                                protocol: portInfo[1]
                            })
                        }
                        image.config.ExposedPortsInfo = portsInfo;
                    }
                    if (image.config.Volumes) {
                        var volumesInfo = [];
                        for (var volume in image.config.Volumes) {
                            volumesInfo.push (volume)
                        }
                        image.config.VolumesInfo = volumesInfo;
                    }
                    if (image.config.Env) {
                        var envInfo = [];
                        for (var j = 0; j < image.config.Env.length; j++) {
                            var env = image.config.Env[j];
                            var info= env.split('=');
                            envInfo.push ({
                                name: info[0],
                                value: info[1]
                            })
                        }
                        image.config.EnvInfo = envInfo;
                    }
                } else {
                    image.config = {};
                }
            }
            $scope.details = details;
            $scope.isReady = true;
        });
        handlePullImage($scope, $modal, dockerRegistryService);
    }])
    .controller('repositoriesController', ['$scope', 'dockerRegistryService', function($scope, dockerRegistryService) {
        handleSearchRequest($scope, dockerRegistryService, 'searchRepositories');
    }])
    .controller('TabsDemoCtrl', function ($scope) {
        $scope.tabs = [
            { title:'Dynamic Title 1', content:'Dynamic content 1' },
            { title:'Dynamic Title 2', content:'Dynamic content 2' }
        ];
    })
    .controller('imagesController', ['$scope', '$modal', 'dockerRegistryService', function($scope, $modal, dockerRegistryService) {
        handleSearchRequest($scope, dockerRegistryService, 'searchImages');
        $scope.openDeletionDialog = function (imageName, tag, displayName) {

            var modalInstance = $modal.open({
                templateUrl: 'deleteImageDialog.html',
                controller: 'deleteImageDialogController',
                ///size: 'sm',
                resolve: {
                    image: function () {
                        return displayName + ":" + tag;
                    }
                }
            });

            modalInstance.result.then(function (confirmed) {
                dockerRegistryService.deleteRepoTag(imageName, tag);
                console.log('Modal confirmed at: ' + new Date());
            }, function () {
                console.log('Modal dismissed at: ' + new Date());
            });
        };
    }])
    .controller('imageInfoController', ['$scope', '$modal', 'dockerRegistryService', function ($scope, $modal, dockerRegistryService) {
        $scope.repository = {};
        $scope.isReady = false;
        $scope.hasResult = false;
        $scope.status = 'unknown';
        //Initialize
        dockerRegistryService.retrieveRepoInfo($scope.image.repository).then(function(result) {
            $scope.repository = result;
            var status = 'invalid';
            var tags = [];
            if (result != null) {
                var repoURL = ($scope.repoName.indexOf('/') >= 0)? 'u/' + $scope.repository : '_/' + $scope.repository;
                $scope.repository.url = 'https://registry.hub.docker.com/' + repoURL + '/';
                status = 'not_found';
                for (var i = 0, len = result.images.length; i < len; i ++) {
                    var image = result.images[i];
                    var flag = false;
                    if (image.id == $scope.image.id) {
                        status = 'found';
                        flag = true;
                    }
                    if (image.tags) {
                        for (var j = 0, n = image.tags.length; j < n; j++) {
                            var tag = image.tags[j];
                            if (tag == $scope.image.tag && flag) {
                                status = 'matched';
                            }
                            tags.push(tag);
                        }
                    }
                }
                $scope.hasResult = true;
            }
            $scope.status = status;
            $scope.isReady = true;
            $scope.repository.tags = tags;
        });
        handlePullImage($scope, $modal, dockerRegistryService);
    }])
    .controller('deleteImageDialogController', function ($scope, $modalInstance, image) {

        $scope.seletedImage = image;

        $scope.ok = function () {
            $modalInstance.close(true);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })
    .controller('pullImageDialogController', function ($scope, $modalInstance, image) {

        $scope.seletedImage = image;

        $scope.ok = function () {
            $modalInstance.dismiss('ok');
        };
    })
    .controller('menuController', ['$scope', '$modal', 'dockerRegistryService', function ($scope, $modal, dockerRegistryService) {
        $scope.openSettingsDialog = function () {
            var modalInstance = $modal.open({
                templateUrl: 'settingsDialog.html',
                controller: 'settingsDialogController',
                ///size: 'sm',
                resolve: {

                }
            });
        };

        $scope.openAboutDialog = function () {
            var modalInstance = $modal.open({
                templateUrl: 'aboutDialog.html',
                controller: 'aboutDialogController',
                ///size: 'sm',
                resolve: {

                }
            });
        }
    }])
    .controller('settingsDialogController', function ($scope, $modalInstance) {
        $scope.ok = function () {
            $modalInstance.dismiss('ok');
        };
    })
    .controller('aboutDialogController', function ($scope, $modalInstance) {
        $scope.ok = function () {
            $modalInstance.dismiss('ok');
        };
    });


