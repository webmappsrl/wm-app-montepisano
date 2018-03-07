angular.module('webmapp')

    .controller('DetailTaxonomyController', function DetailTaxonomyController(
        Utils,
        CONFIG,
        $translate,
        $ionicLoading,
        $state
    ) {
        var vm = {};

        vm.title = CONFIG.OPTIONS.title;
        var communicationConf = CONFIG.COMMUNICATION;

        vm.currentLang = $translate.preferredLanguage() ? $translate.preferredLanguage() : "it";
        vm.taxonomy = {};
        vm.item = {};
        vm.fullDescription = false;

        var taxonomyType = $state.params.parentId,
            id = $state.params.id * 1; // * 1 is to make id integrer

        var setItem = function (itemToSet) {
            vm.item = itemToSet
            vm.title = vm.item.name;

            $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + 'route?' + taxonomyType + '=' + id, function (data) {
                console.log(data);
            }).fail(function () {
            });
        };

        var getTaxonomyDetails = function () {
            vm.taxonomy = localStorage.$wm_taxonomy ? JSON.parse(localStorage.$wm_taxonomy) : {};
            if (!vm.taxonomy[0]) {
                $ionicLoading.show();
            } else {
                for (var i in vm.taxonomy) {
                    if (vm.taxonomy[i].id === id) {
                        setItem(vm.taxonomy[i]);
                        break;
                    }
                }

                if (!vm.item.id) {
                    $ionicLoading.show();
                }
            }

            $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + taxonomyType + '/' + id, function (data) {
                vm.taxonomy = localStorage.$wm_taxonomy ? JSON.parse(localStorage.$wm_taxonomy) : {};
                var pos = 0;
                if (vm.taxonomy[0]) {
                    for (var i in vm.taxonomy) {
                        if (vm.taxonomy[i].id === data.id) {
                            if (data.count > 0) {
                                vm.taxonomy[i] = data;
                                setItem(vm.taxonomy[i]);
                            }
                            else {
                                delete vm.taxonomy[i];
                                console.log("no item");
                            }
                            break;
                        }
                    }
                }
                else {
                    if (data.count > 0) {
                        vm.taxonomy[0] = data;
                        setItem(vm.taxonomy[0]);
                    }
                    else {
                        console.log("no item")
                    }
                }

                localStorage.$wm_taxonomy = JSON.stringify(vm.taxonomy);

                finishLoading();

                Utils.forceDigest();
            }).fail(function () {
                console.warn("Internet connection not available. Using local storage taxonomy");
                vm.taxonomy = localStorage.$wm_taxonomy ? JSON.parse(localStorage.$wm_taxonomy) : {};
                if (!vm.taxonomy.length) {
                    finishLoading();
                    //Popup connection not available
                    console.warn("Looks like this is your first application load. Do it again with a connection open");
                    return;
                } else {
                    for (var i in vm.taxonomy) {
                        if (vm.taxonomy[i].id === id) {
                            setItem(vm.taxonomy[i]);
                            break;
                        }
                    }

                    if (!vm.item.id) {
                        console.log("no item")
                    }
                    finishLoading();
                }
            });
        };

        var finishLoading = function () {
            $ionicLoading.hide();
        };

        vm.toggleDescription = function() {
            vm.fullDescription = !vm.fullDescription;
            Utils.forceDigest();
        };

        getTaxonomyDetails();
        return vm;
    });