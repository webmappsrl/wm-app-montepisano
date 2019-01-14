angular.module('webmapp')

    .controller('HelpController', function HelpController(
        $translate,
        CONFIG,
        Utils
    ) {
        var vm = {};

        vm.title = "Help";
        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.tabCount = [0, 1, 2, 3, 4, 5, 6];

        vm.goToMainPage = function () {
            if (CONFIG.OPTIONS.startUrl.indexOf('packages') !== -1) {
                Utils.goTo('packages');
            }
            else if (CONFIG.OPTIONS.startUrl.indexOf('home') !== -1) {
                Utils.goTo('home');
            }
            else {
                Utils.goTo('/');
            }
        };

        vm.switchTab = function (dir) {
            switch (dir) {
                case 'left':
                    if (vm.currentTab < vm.tabCount.length - 1) {
                        vm.previousTab = vm.currentTab;
                        vm.currentTab++;
                        Utils.forceDigest();
                    }
                    break;
                case 'right':
                    if (vm.currentTab > 0) {
                        vm.previousTab = vm.currentTab;
                        vm.currentTab--;
                        Utils.forceDigest();
                    }
                    break;
                default:
                    break;
            }
        }

        // credit: http://www.javascriptkit.com/javatutors/touchevents2.shtml
        function swipedetect(el, callback) {
            var touchsurface = el,
                swipedir,
                startX,
                startY,
                distX,
                distY,
                threshold = 50, //required min distance traveled to be considered swipe
                restraint = 100, // maximum distance allowed at the same time in perpendicular direction
                allowedTime = 500, // maximum time allowed to travel that distance
                elapsedTime,
                startTime,
                handleswipe = callback || function (swipedir) { }

            touchsurface.addEventListener('touchstart', function (e) {
                var touchobj = e.changedTouches[0]
                swipedir = 'none'
                dist = 0
                startX = touchobj.pageX
                startY = touchobj.pageY
                startTime = new Date().getTime() // record time when finger first makes contact with surface
                e.preventDefault()
            }, false)

            touchsurface.addEventListener('touchmove', function (e) {
                e.preventDefault() // prevent scrolling when inside DIV
            }, false)

            touchsurface.addEventListener('touchend', function (e) {
                var touchobj = e.changedTouches[0]
                distX = touchobj.pageX - startX // get horizontal dist traveled by finger while in contact with surface
                distY = touchobj.pageY - startY // get vertical dist traveled by finger while in contact with surface
                elapsedTime = new Date().getTime() - startTime // get time elapsed
                if (elapsedTime <= allowedTime) { // first condition for awipe met
                    if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) { // 2nd condition for horizontal swipe met
                        swipedir = (distX < 0) ? 'left' : 'right' // if dist traveled is negative, it indicates left swipe
                    } else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) { // 2nd condition for vertical swipe met
                        swipedir = (distY < 0) ? 'up' : 'down' // if dist traveled is negative, it indicates up swipe
                    }
                }
                handleswipe(swipedir)
                e.preventDefault()
            }, false)
        }

        var el = document.getElementById('help-content');
        swipedetect(el, vm.switchTab);

        vm.currentTab = 0;
        vm.previousTab = -2;

        return vm;
    });
