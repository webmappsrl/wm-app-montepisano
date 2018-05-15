angular.module('webmapp')

    .controller('HelpController', function HelpController(
        $rootScope,
        Offline,
        Utils,
        CONFIG,
        $translate
    ) {
        var vm = {};

        vm.title = "Help";
        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";

        vm.goToMainPage = function() {
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

        var currentTab = 0;
        var dir = "";
        showTab(currentTab);

        function showTab(n) {
            var x = document.getElementsByClassName("tab");
            if (dir == "left") {
                if (currentTab + 1 === x.length) {
                    x[currentTab].className = "tab final-tab animate-leftin";
                }
                else {
                    x[currentTab].className = "tab animate-leftin";
                }
            } else if (dir == "right") {
                if (currentTab + 1 === x.length) {
                    x[currentTab].className = "tab final-tab animate-rightin";
                }
                else {
                    x[currentTab].className = "tab animate-rightin";
                }
            }
            x[currentTab].style.display = "block";
            vm.title = "help." + currentTab + ".title";
            dir = "";
            fixStepIndicator(n)
        }

        function nextPrev(n) {
            // This function will figure out which tab to display
            var x = document.getElementsByClassName("tab");

            if (currentTab + n >= 0 && currentTab + n < x.length) {
                if (n > 0) {
                    x[currentTab].className = "tab animate-leftout";
                    dir = "right";
                } else {
                    x[currentTab].className = "tab animate-rightout";
                    dir = "left";
                }
                x[currentTab].style.display = "none";
                currentTab = currentTab + n;
                showTab(currentTab);
            }
        }

        function fixStepIndicator(n) {
            // This function removes the "active" class of all steps...
            var i, x = document.getElementsByClassName("step");
            for (i = 0; i < x.length; i++) {
                x[i].className = x[i].className.replace(" active", "");
            }
            //... and adds the "active" class on the current step:
            x[n].className += " active";

            Utils.forceDigest();
        }

        // credit: http://www.javascriptkit.com/javatutors/touchevents2.shtml
        function swipedetect(el, callback) {

            var touchsurface = el,
                swipedir,
                startX,
                startY,
                distX,
                distY,
                threshold = 70, //required min distance traveled to be considered swipe
                restraint = 100, // maximum distance allowed at the same time in perpendicular direction
                allowedTime = 300, // maximum time allowed to travel that distance
                elapsedTime,
                startTime,
                handleswipe = callback || function (swipedir) {}

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
        swipedetect(el, function (swipedir) {
            switch (swipedir) {
                case 'left':
                    nextPrev(1);
                    break;
                case 'right':
                    nextPrev(-1);
                    break;
                default:
                    break;
            }
        });
        return vm;
    });