angular.module('myRepository', ['ui.bootstrap'])
    .factory('dockerRegistryService', ['$http', function($http) {
        var dockerRegistryService = {
            listRepoTags: function(repo) {
                return $http(
                    {
                        method: 'GET',
                        url: '/resources/registries/public/repositories/' + repo + '/details'
                    }).then(function (response){
                        return response.data
                    }, function(response){
                        return null;
                    });
            }
        };
        return dockerRegistryService;
    }])
    .controller('repositoryTagsController', ['$scope', 'dockerRegistryService', function ($scope, dockerRegistryService) {
        $scope.tagsInfo = [];
        $scope.isReady = false;
        $scope.hasResult = false;
        //Initialize
        dockerRegistryService.listRepoTags($scope.repoName).then(function(details) {
            var tagsInfo = details.tags;
            var repoURL = (details.name.indexOf('/') >= 0)? 'u/' + details.name : '_/' + details.name;
            details.url = 'https://registry.hub.docker.com/' + repoURL + '/';

            for (var i = 0; i < tagsInfo.length; i ++) {
                var image = tagsInfo[i];
                image.isLatest = (image.tag == 'latest');
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

    }])
    .controller('TabsDemoCtrl', function ($scope) {
        $scope.tabs = [
            { title:'Dynamic Title 1', content:'Dynamic content 1' },
            { title:'Dynamic Title 2', content:'Dynamic content 2' }
        ];
    });
