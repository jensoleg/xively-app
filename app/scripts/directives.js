angular.module('XivelyApp.directives', [])

    .constant('WEATHER_ICONS', {
        'partlycloudy': 'ion-ios7-partlysunny-outline',
        'mostlycloudy': 'ion-ios7-partlysunny-outline',
        'cloudy': 'ion-ios7-cloudy-outline',
        'rain': 'ion-ios7-rainy-outline',
        'tstorms': 'ion-ios7-thunderstorm-outline',
        'sunny': 'ion-ios7-sunny-outline',
        'clear': 'ion-ios7-sunny-outline',
        'nt_clear': 'ion-ios7-moon-outline',
        'gauge': 'ion-power',
        'power': 'ion-ios7-gear-outline'
    })

    .directive('weatherIcon', function (WEATHER_ICONS) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                icon: '='
            },
            template: '<i class="icon" ng-class="weatherIcon"></i>',
            link: function ($scope) {

                $scope.$watch('icon', function (v) {
                    if (!v) {
                        return;
                    }

                    var icon = v;

                    if (icon in WEATHER_ICONS) {
                        $scope.weatherIcon = WEATHER_ICONS[icon];
                    } else {
                        $scope.weatherIcon = WEATHER_ICONS['cloudy'];
                    }
                });
            }
        }
    })

    .directive('currentTime', function ($timeout, $filter) {
        return {
            restrict: 'E',
            replace: true,
            template: '<span class="current-time">{{currentTime}}</span>',
            scope: {
                localtz: '='
            },
            link: function ($scope, $element, $attr) {
                $timeout(function checkTime() {
                    if ($scope.localtz) {
//                        $scope.currentTime = $filter('date')(+(new Date), 'h:mm') + $scope.localtz;
                        $scope.currentTime = $filter('date')(+(new Date), 'HH:mm');

                    }
                    $timeout(checkTime, 500);
                });
            }
        }
    })

    .directive('currentWeather', function ($timeout, $rootScope, Settings) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/current-weather.html',
            scope: true,
            compile: function (element, attr) {
                return function ($scope, $element, $attr) {

                    $rootScope.$on('settings.changed', function (settings) {
                        var units = Settings.get('tempUnits');

                        if ($scope.forecast) {

                            var forecast = $scope.forecast;
                            var current = $scope.current;

                            if (units == 'f') {
                                $scope.highTemp = forecast.forecastday[0].high.fahrenheit;
                                $scope.lowTemp = forecast.forecastday[0].low.fahrenheit;
                                $scope.currentTemp = Math.floor(current.temp_f);
                            } else {
                                $scope.highTemp = forecast.forecastday[0].high.celsius;
                                $scope.lowTemp = forecast.forecastday[0].low.celsius;
                                $scope.currentTemp = Math.floor(current.temp_c);
                            }
                        }
                    });

                    $scope.$watch('current', function (current) {
                        var units = Settings.get('tempUnits');

                        if (current) {
                            if (units == 'f') {
                                $scope.currentTemp = Math.floor(current.temp_f);
                            } else {
                                $scope.currentTemp = Math.floor(current.temp_c);
                            }
                        }
                    });

                    $scope.$watch('forecast', function (forecast) {
                        var units = Settings.get('tempUnits');

                        if (forecast) {
                            if (units == 'f') {
                                $scope.highTemp = forecast.forecastday[0].high.fahrenheit;
                                $scope.lowTemp = forecast.forecastday[0].low.fahrenheit;
                            } else {
                                $scope.highTemp = forecast.forecastday[0].high.celsius;
                                $scope.lowTemp = forecast.forecastday[0].low.celsius;
                            }
                        }
                    });

                    // Delay so we are in the DOM and can calculate sizes
                    $timeout(function () {
                        var windowHeight = window.innerHeight;
                        var thisHeight = $element[0].offsetHeight;
                        //var headerHeight = document.querySelector('#header').offsetHeight;
                        //var padding = document.querySelector('#main-content');
                        $element[0].style.paddingTop = (windowHeight - thisHeight - 25) + 'px';
                        angular.element(document.querySelector('.scroll-content')).css('-webkit-overflow-scrolling', 'auto');
                        $timeout(function () {
                            angular.element(document.querySelector('.scroll-content')).css('-webkit-overflow-scrolling', 'touch');
                        }, 50);
                    });
                }
            }
        }
    })

    .directive('xively', function ($timeout) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/xively.html',
            link: function ($scope, $element, $attr) {
            }
        }
    })

    .directive('forecast', function ($timeout) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/forecast.html',
            link: function ($scope, $element, $attr) {
            }
        }
    })

    .directive('weatherBox', function ($timeout) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {
                title: '@'
            },
            template: '<div class="weather-box"><h4 class="title">{{title}}</h4><div ng-transclude></div></div>',
            link: function ($scope, $element, $attr) {
            }
        }
    })

    .directive('backgroundCycler', function ($compile, $animate) {
        var animate = function ($scope, $element, newImageUrl) {
            var child = $element.children()[0];

            var scope = $scope.$new();
            scope.url = newImageUrl;
            var img = $compile('<background-image></background-image>')(scope);

            $animate.enter(img, $element, null, function () {
                console.log('Inserted');
            });
            if (child) {
                $animate.leave(angular.element(child), function () {
                    console.log('Removed');
                });
            }
        };

        return {
            restrict: 'E',
            link: function ($scope, $element, $attr) {
                $scope.$watch('activeBgImage', function (v) {
                    if (!v) {
                        return;
                    }
                    console.log('Active bg image changed', v);
                    var item = v;
                    var url = "http://farm" + item.farm + ".static.flickr.com/" + item.server + "/" + item.id + "_" + item.secret + "_z.jpg";
                    animate($scope, $element, url);
                });
            }
        }
    })

    .directive('backgroundImage', function ($compile, $animate) {
        return {
            restrict: 'E',
            template: '<div class="bg-image"></div>',
            replace: true,
            scope: true,
            link: function ($scope, $element, $attr) {
                if ($scope.url) {
                    $element[0].style.backgroundImage = 'url(' + $scope.url + ')';
                }
            }
        }
    });
