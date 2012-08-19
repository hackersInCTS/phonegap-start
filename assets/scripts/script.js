// View models
var MapViewModel = function () {
    this.location = "New York, NY";
    this.zoom = 14;
    this.width = 288;
    this.height = 200;
    this.markers = ["New York, NY"];
    this.sensor = true;
    this.getMapUrl = function () {
        return 'https://maps.googleapis.com/maps/api/staticmap?center=' + this.location +
            '&zoom=' + this.zoom + '&size=' + this.width + 'x' + this.height +
            '&markers=' + this.markers.join('|') + '&sensor=' + this.sensor;
    };
};

//Namespaced JS
var Spinach = Spinach || {};

Spinach.GoogleMaps = (function ($) {
    return {
        geocode:function (address, onSuccess, onError) {
            var geoCoder = new google.maps.Geocoder();
            geoCoder.geocode({ 'address':address}, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var location = {
                        longitude:results[0].geometry.location.lng,
                        latitude:results[0].geometry.location.lat,
                        address:results[0].formatted_address
                    };
                    onSuccess(location);
                } else {
                    onError('Geocode was not successful for the following reason: ' + status);
                }
            });
        },
        reverseGeocode:function (latitude, longitude, onSuccess, onError) {
            var latLong = new google.maps.LatLng(latitude, longitude);
            var geoCoder = new google.maps.Geocoder();
            geoCoder.geocode({
                'latLng':latLong
            }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[5]) {
                        return onSuccess(results[5].formatted_address);
                    }
                } else {
                    onError("reverseGeocode failed due to: " + status);
                }
            });
        }
    };
}(jQuery));

Spinach.Common = (function ($) {
    return {
        alert:function (message) {
            try {
                navigator.notification.alert(message, $.noop, "CTS Hackers");
            }
            catch (e) {
                alert(message);
            }
        }
    };
}(jQuery));

Spinach.Home = (function ($) {
    return {
        initialize:function () {

        },
        deviceReady:function () {
            Spinach.Common.alert("PhoneGap is alive and kicking!!");
        },
        currentLocationClick:function () {
            $('#CurrentLocationFlag').val(true);
            Spinach.Home.goToMapPage();
        },
        goToMapPage:function () {
            Spinach.Map.resetMaps();
            $.mobile.changePage($('#map'));
        }
    };
}(jQuery));

Spinach.Dialog = (function ($) {
    return {
        initialize:function () {

        },
        plotSpecificLocationClick:function (e) {
            if ($('#address').val()) {
                $('#CurrentLocationFlag').val(false);
                Spinach.Home.goToMapPage();
            } else {
                e.preventDefault();
            }
        }
    };
}(jQuery));

Spinach.Map = (function ($) {
    return {
        initialize:function () {
            if ($('#CurrentLocationFlag').val() === 'true') {
                Spinach.Map.getCurrentPosition();
            } else {
                Spinach.Map.getSpecificLocation();
            }
        },
        resetMaps:function () {
            $('#mapPlotImg').attr('src', '');
            $('#LocationMarker').empty();
        },
        getSpecificLocation:function () {
            var userInput = $('#address').val();
            $('#address').val('');
            var onGeocodeSuccess = function (location) {
                var mapViewModel = new MapViewModel();
                mapViewModel.location = location.latitude + ', ' + location.longitude;
                mapViewModel.markers = [location.address];
                $('#LocationMarker').text(location.address);
                Spinach.Map.plotMap(mapViewModel);
            };
            var onGeocodeError = function (mapViewModel) {
                return function (errorReason) {
                    console.log(errorReason);
                };
            };
            Spinach.GoogleMaps.geocode(userInput, onGeocodeSuccess, onGeocodeError);
        },
        getCurrentPosition:function () {
            var onReverseGeocodeSuccess = function (mapViewModel) {
                return function (resolvedCity) {
                    $('#LocationMarker').text(resolvedCity);
                    Spinach.Map.plotMap(mapViewModel);
                };
            };
            var onReverseGeocodeError = function (mapViewModel) {
                return function (errorReason) {
                    console.log(errorReason);
                    Spinach.Map.plotMap(mapViewModel);
                };
            };
            var onGetPositionSuccess = function (position) {
                var mapViewModel = new MapViewModel();
                var location = position.coords.latitude + ', ' + position.coords.longitude;
                mapViewModel.location = location;
                mapViewModel.markers = [location];
                Spinach.GoogleMaps.reverseGeocode(position.coords.latitude,
                    position.coords.longitude,
                    onReverseGeocodeSuccess(mapViewModel),
                    onReverseGeocodeError(mapViewModel));
            };
            var onGetPositionError = function (error) {
                Spinach.Common.alert('code: ' + error.code + '\n' +
                    'message: ' + error.message + '\n');
            };
            var geoLocationOptions = { maximumAge:30000, timeout:1000, enableHighAccuracy:true };
            navigator.geolocation.getCurrentPosition(onGetPositionSuccess, onGetPositionError, geoLocationOptions);
        },
        plotMap:function (mapViewModel) {
            $('#mapPlotImg').attr('src', mapViewModel.getMapUrl());
        }
    };
}(jQuery));

//Page specific initialize events
$(document).on("pageshow", "#index", function () {
    Spinach.Home.initialize();
});

$(document).on("pageshow", "#dialog", function () {
    Spinach.Dialog.initialize();
});

$(document).on("pageshow", "#map", function () {
    Spinach.Map.initialize();
});

$(document).ready(function () {
    $(document).on('deviceready', Spinach.Home.deviceReady);
    $(document).on('click', '#CurrentLocation', Spinach.Home.currentLocationClick);
    $(document).on('click', '#PlotSpecificLocationButton', Spinach.Dialog.plotSpecificLocationClick);
});