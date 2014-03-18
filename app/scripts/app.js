angular.module('XivelyApp', ['dx', 'ionic', 'XivelyApp.services', 'XivelyApp.filters', 'XivelyApp.directives'])

    .constant('WUNDERGROUND_API_KEY', 'c83d92d7b5befd29')

    .constant('FLICKR_API_KEY', '504fd7414f6275eb5b657ddbfba80a2c')

    .filter('int', function () {
        return function (v) {
            return parseInt(v) || '';
        };
    })

    .filter('orderObjectBy', function () {
        return function (items, field, reverse) {
            var filtered = [];
            angular.forEach(items, function (item) {
                filtered.push(item);
            });
            filtered.sort(function (a, b) {
                return a[field].localeCompare(b[field]);
            });
            filtered.sort();
            if (reverse) filtered.reverse();
            return filtered;
        };
    })

    .controller('WeatherCtrl', function ($scope, $timeout, $location, $ionicScrollDelegate, $rootScope, xively, Weather, Geo, Flickr, $ionicModal) {
        var _this = this;

        ionic.Platform.ready(function () {
            // Hide the status bar
            StatusBar.hide();
        });

        $scope.activeBgImageIndex = 0;
        $rootScope.currentDataStream = {};

        $scope.gaugeScale = {};
        $scope.gaugeRange = {};
        $scope.gaugeValue = {};
        $scope.gaugeSubvalues = [];
        $scope.viewXively = false;

        $scope.gaugeSettings =
        {
            subvalues: $scope.gaugeSubvalues,
            scale: $scope.gaugeScale,
            rangeContainer: $scope.gaugeRange,
            tooltip: { enabled: true },
            value: $scope.gaugeValue,
            subvalueIndicator: {
                offset: -10 }
        };

        $scope.chartData = [];

        $scope.chartSettings =
        {
            dataSource: $scope.chartData,
            argumentAxis: {
                argumentType: 'datetime',
                label: { format: 'H:mm', color: 'white'},
                valueMarginsEnabled: false,
                tick: {
                    visible: true
                }
            },
            valueAxis: {
                valueMarginsEnabled: false,
                tick: {
                    visible: true
                },
                type: 'continuous',
                valueType: 'numeric',
                tickInterval: 0.5,
                grid: {visible: false},
                //min: 0,
                label: {visible: true, color: 'white'}
            },
            series: [
                {
                    argumentField: 'at',
                    valueField: 'value',
                    type: 'line',
                    point: { visible: false },
                    style: { opacity: 0.70 },
                    color: 'rgba(255,255,255,0.9)',
                    hoverStyle: { color: 'rgb(74, 135, 238)' }
                }
            ],
            legend: {
                visible: false
            },
            tooltip: {
                enabled: true
            },
            crosshair: {
                enabled: true,
                horizontalLine: {
                    color: 'white',
                    dashStyle: 'longDash'
                },
                verticalLine: {
                    color: 'white',
                    dashStyle: 'dotdashdot'
                },
                opacity: 0.8
            }

        };

        $scope.toggleView = function () {
            $scope.viewXively = !$scope.viewXively;
            $location.hash("1");
            $ionicScrollDelegate.anchorScroll();
        };

        $scope.showSettings = function () {
            if (!$scope.settingsModal) {
                // Load the modal from the given template URL
                $ionicModal.fromTemplateUrl('settings.html', function (modal) {
                    $scope.settingsModal = modal;
                    $scope.settingsModal.show();
                }, {
                    // The animation we want to use for the modal entrance
                    animation: 'slide-in-up'
                });
            } else {
                $scope.settingsModal.show();
            }
        };

        $scope.showData = function (stream) {
            if (!(angular.isUndefined($rootScope.activeStream) || $rootScope.activeStream === null) && $rootScope.activeStream.id == $rootScope.datastreams[stream].id) {
                $rootScope.activeStream = null;
                $scope.chartData = null;
                $scope.$broadcast('scroll.resize');
            }
            else {
                xively.get(stream);
                $rootScope.activeStream = $rootScope.datastreams[stream];
            }

            //$location.hash("3");
            //$ionicScrollDelegate.anchorScroll();
        };

        $scope.showValueCtrl = function (stream) {
            $rootScope.datastreams[stream].isSelecting = true;
            $rootScope.datastreams[stream].newValue = $rootScope.datastreams[stream].current_value;
        };

        $scope.setValueCtrl = function (stream) {
            $rootScope.datastreams[stream].isSelecting = false;
            $rootScope.datastreams[stream].current_value = $rootScope.datastreams[stream].newValue;
            xively.publish(stream, $rootScope.datastreams[stream].current_value);
        };

        $scope.closeValueCtrl = function (stream) {
            $rootScope.datastreams[stream].isSelecting = false;
            $rootScope.datastreams[stream].newValue = $rootScope.datastreams[stream].current_value;
        };

        $scope.toggleCtrlSwitch = function (stream) {
            xively.publish(stream, $rootScope.datastreams[stream].current_value);
        };

        $rootScope.$watchCollection('currentDataStream.data', function (data) {
            if (angular.isDefined(data) && data.length > 0 && $rootScope.activeStream != null) {
                $scope.chartData = data;
                $scope.chartSettings.dataSource = $scope.chartData;
                _this.updateGauge($rootScope.activeStream, data[data.length - 1].value);
            }
            else {
                $scope.chartData = [];
                $scope.chartSettings.dataSource = $scope.chartData;
            }
            $location.hash("2");
            $ionicScrollDelegate.anchorScroll();
            $scope.$broadcast('scroll.resize');
            $scope.$broadcast('slideBox.update');
        });

        this.updateGauge = function (stream, newValue) {
            $scope.gaugeScale =
            {
                startValue: stream.minDomain, endValue: stream.maxDomain,
                majorTick: { tickInterval: 5 },
                minorTick: {
                    visible: true,
                    tickInterval: 1
                },
                label: {
                    customizeText: function (arg) {
                        return arg.valueText;
                    }
                },
                valueType: "numeric"
            };

            $scope.gaugeRange =
            {
                ranges: [
                    { startValue: stream.minDomain, endValue: stream.minCritical, color: '#0077BE'},
                    { startValue: stream.minCritical, endValue: stream.maxCritical, color: '#E6E200'},
                    { startValue: stream.maxCritical, endValue: stream.maxDomain, color: '#77DD77'}
                ],
                offset: 5
            };

            $scope.gaugeValue = newValue;

            $scope.gaugeSubvalues = [stream.min_value, stream.max_value];
            $scope.gaugeSettings.scale = $scope.gaugeScale;
            $scope.gaugeSettings.rangeContainer = $scope.gaugeRange;
            $scope.gaugeSettings.value = $scope.gaugeValue;
            $scope.gaugeSettings.subvalues = $scope.gaugeSubvalues;

        };

        this.getBackgroundImage = function (lat, lng, locString) {
            Flickr.search(locString, lat, lng).then(function (resp) {
                var photos = resp.photos;
                if (photos.photo.length) {
                    $scope.bgImages = photos.photo;
                    _this.cycleBgImages();
                }
                //$rootScope.$broadcast('scroll.refreshComplete');
            }, function (error) {
                console.error('Unable to get Flickr images', error);
            });
        };

        this.getForecast = function (lat, lng) {
            Weather.getForecast(lat, lng).then(function (resp) {
                $scope.forecast = resp.forecast.simpleforecast;
            }, function (error) {
                alert('Unable to get forecast. Try again later');
                console.error(error);
            });

            Weather.getHourly(lat, lng).then(function (resp) {
                $scope.hourly = resp.hourly_forecast;
                //console.log($scope.hourly);
                //$rootScope.$broadcast('scroll.refreshComplete');
            }, function (error) {
                alert('Unable to get forecast. Try again later.');
                console.error(error);
            });
        };

        this.getCurrent = function (lat, lng) {
            Weather.getAtLocation(lat, lng).then(function (resp) {
                $scope.current = resp.current_observation;
                _this.getForecast(resp.location.lat, resp.location.lon);
            }, function (error) {
                alert('Unable to get current conditions');
                console.error(error);
            });
        };

        this.cycleBgImages = function () {
            $timeout(function cycle() {
                if ($scope.bgImages) {
                    $scope.activeBgImage = $scope.bgImages[$scope.activeBgImageIndex++ % $scope.bgImages.length];
                }
                //$timeout(cycle, 10000);
            });
        };

        $scope.refreshData = function () {

            xively.refresh();

            Geo.getLocation().then(function (position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;

                Geo.reverseGeocode(lat, lng).then(function (locString) {
                    _this.getBackgroundImage(lat, lng, locString);
                });
                _this.getCurrent(lat, lng);
            }, function (error) {
                alert('Unable to get current location: ' + error);
            });

            //$scope.$broadcast('scroll.resize');
        };

        $scope.refreshData();
    })

    .
    controller('SettingsCtrl', function ($scope, Settings) {
        $scope.settings = Settings.getSettings();

        // Watch deeply for settings changes, and save them
        // if necessary
        $scope.$watch('settings', function (v) {
            Settings.save();
        }, true);

        $scope.closeSettings = function () {
            $scope.modal.hide();
        };

    });
