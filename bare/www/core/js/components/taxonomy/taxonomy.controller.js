angular.module('webmapp')

    .controller('TaxonomyController', function TaxonomyController(
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

        var getTaxonomy = function (taxonomyType) {
            vm.taxonomy = localStorage.$wm_taxonomy ? JSON.parse(localStorage.$wm_taxonomy) : {};
            if (!vm.taxonomy[0]) {
                $ionicLoading.show();
            }

            console.log(vm.taxonomy)

            $.getJSON(communicationConf.baseUrl + communicationConf.wordPressEndpoint + taxonomyType + '?per_page=100', function (data) {
                vm.taxonomy = {};
                var pos = 0;
                for (var i in data) {
                    if (data[i].count > 0) {
                        vm.taxonomy[pos] = data[i];
                        pos++;
                    }
                }
                console.log(vm.taxonomy)

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
                }
            });
        };

        var finishLoading = function () {
            $ionicLoading.hide();
        }

        vm.goTo = function(id) {
            Utils.goTo('taxonomy/' + $state.params.id + '/' + id);
        };

        getTaxonomy($state.params.id);

        return vm;
    });