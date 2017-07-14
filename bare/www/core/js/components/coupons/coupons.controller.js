angular.module('webmapp')

.controller('CouponController', function CouponController(
    $location,
    $rootScope,
    MapService,
    Model,
    Utils,
    CONFIG
) {
    var vm = {},
        featureMapById = vm.featureMapById = MapService.getFeatureIdMap();
    
    vm.coupons = MapService.getCouponsList();

    vm.openCoupon = function(coupon) {
        var poiToOpen;

        if (coupon && 
            typeof coupon.pois === 'object' && 
            typeof featureMapById[coupon.pois[0]] !== 'undefined') {
            poiToOpen = featureMapById[coupon.pois[0]];
            Utils.goTo('layer/' + poiToOpen.parent.label.replace(/ /g, '_') + '/' + poiToOpen.properties.id);
        }
    };

    return vm;
});