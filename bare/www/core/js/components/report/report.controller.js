angular.module('webmapp')

    .controller('ReportController', function ReportController(
        CONFIG,
        Utils
    ) {
        var vm = {};

        vm.title = "Segnala";
        vm.colors = CONFIG.STYLE;

        vm.reports = (CONFIG.USER_COMMUNICATION && CONFIG.USER_COMMUNICATION.REPORT && CONFIG.USER_COMMUNICATION.REPORT.items) ? angular.copy(CONFIG.USER_COMMUNICATION.REPORT.items) : [];
        vm.selectedReport = vm.reports.length === 1 ? 0 : -1;
        vm.toastTimeout = null;

        vm.goBack = function () {
            if (vm.selectedReport !== -1 && vm.reports.length !== 1) {
                vm.selectedReport = -1;
                vm.title = "Segnala";
            }
            else {
                Utils.goBack();
            }
            Utils.forceDigest();
        };

        vm.selectReport = function (key) {
            vm.selectedReport = key;
            vm.title = vm.reports[key].title;

            for (var i in vm.reports[key].fields) {
                vm.reports[key].fields[i].value = "";
            }

            vm.validateForm();
            Utils.forceDigest();
        };

        vm.showHelp = function (key) {
            clearTimeout(vm.toastTimeout);
            Utils.showToast(vm.reports[vm.selectedReport].fields[key].help, 'bottom');
            vm.toastTimeout = setTimeout(function () {
                vm.toastTimeout = null;
                Utils.hideToast();
            }, 5000);
        };

        vm.getPicture = function (sourceType, key) {
            if (navigator.camera) {
                var options = {
                    quality: 10,
                    destinationType: navigator.camera.DestinationType.DATA_URL,
                    sourceType: sourceType ? navigator.camera.PictureSourceType.CAMERA : navigator.camera.PictureSourceType.PHOTOLIBRARY,
                    saveToPhotoAlbum: true
                };

                navigator.camera.getPicture(function (data) {
                    vm.reports[vm.selectedReport].fields[key].value = data;
                    $(window).trigger('resize');
                    Utils.forceDigest();
                }, function (err) {
                    console.warn(err);
                }, options);
            }
        };

        vm.resetPicture = function (key) {
            vm.reports[vm.selectedReport].fields[key].value = '';
            Utils.forceDigest();
        };

        vm.validateForm = function () {
            var valid = true;
            for (var i in vm.reports[vm.selectedReport].fields) {
                if (vm.reports[vm.selectedReport].fields[i].value === "" && vm.reports[vm.selectedReport].fields[i].mandatory) {
                    valid = false;
                    break;
                }
            }

            vm.isValid = valid;
        };

        vm.sendReport = function () {
            console.log(vm.reports[vm.selectedReport]);
        };

        return vm;
    });
