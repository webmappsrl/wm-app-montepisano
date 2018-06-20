describe('Go to Routes then filter packages', function() {


    it('it should go from home to routes', function() {


        expect(browser.getTitle()).toEqual('Webmapp');

        var button = $("ion-header-bar > div.buttons.buttons-left > span > button");

        button.click();

        var routesButton = element(by.repeater('item in vm.advancedMenuItems').row(1)).getText();
        expect(routesButton).toBe("Routes");

        routesButton.click();
    });


    describe("by name, id and category.", function() {

        it('it should filter packages by name', function() {

            var search = element(by.model('vm.search'));
            search.clear();
            var packages = element.all(by.repeater('item in vm.packages | categoryFilter : vm.filters | packagesSearchFilter : vm.search'));

            var count = packages.count();
            expect(count).not.toBeLessThan(2);

            var firstElement = element(by.repeater('item in vm.packages | categoryFilter : vm.filters | packagesSearchFilter : vm.search').row(0));

            expect(firstElement).toBeDefined();

            var firstTitle = firstElement.$('div.details-reduced > div.packages-title-reduced.ng-binding');
            expect(firstTitle).toBeDefined();
            var keys = firstTitle.getText().then(function(txt) { return txt.substring(0, 5) });
            // var keys = "PISA";
            search.sendKeys(keys);

            var filteredPackages = element.all(by.repeater('item in vm.packages | categoryFilter : vm.filters | packagesSearchFilter : vm.search'));

            var filteredcount = filteredPackages.count();
            expect(filteredcount).not.toBeLessThan(1);
            expect(filteredcount).toBeLessThan(count);

            var filteredPackagesTitle = filteredPackages.all(by.css(('div.details-reduced > div.packages-title-reduced.ng-binding')));

            filteredPackagesTitle.each(function(elem, index) {
                elem.getText().then(function(txt) {
                    var tmp = txt.toLowerCase();
                    keys.then(function(val) {
                        expect(tmp.includes(val.toLowerCase())).toBe(true);
                    })
                })
            });

        });

        it('it should filter packages by id', function() {

            var search = element(by.model('vm.search'));
            search.clear();
            var packages = element.all(by.repeater('item in vm.packages | categoryFilter : vm.filters | packagesSearchFilter : vm.search'));
            // var count = packages.count().then(function(num) { return num; });
            var count = packages.count();
            expect(count).not.toBeLessThan(2);

            var firstElement = element(by.repeater('item in vm.packages | categoryFilter : vm.filters | packagesSearchFilter : vm.search').row(0));


            expect(firstElement).toBeDefined();

            var firstCode = firstElement.$('div.details-reduced > div.content-reduced > div.code-reduced.ng-binding');
            expect(firstCode).toBeDefined();
            var keys = firstCode.getText().then(function(txt) { return txt.substring(0, 5) });
            // var keys = "PISA";
            search.sendKeys(keys);

            var filteredPackages = element.all(by.repeater('item in vm.packages | categoryFilter : vm.filters | packagesSearchFilter : vm.search'));

            var filteredcount = filteredPackages.count();
            expect(filteredcount).not.toBeLessThan(1);
            expect(filteredcount).toBeLessThan(count);

            var filteredPackagesCodes = filteredPackages.all(by.css(('div.details-reduced > div.content-reduced > div.code-reduced.ng-binding')));

            filteredPackagesCodes.each(function(elem, index) {
                elem.getText().then(function(txt) {
                    var tmp = txt.toLowerCase();
                    keys.then(function(val) {
                        expect(tmp.includes(val.toLowerCase())).toBe(true);
                    })
                })
            });

        });


    });

    describe('Filter by category', function() {


        var count;
        var iconClassArray = [];
        var filterButton;
        var modalClose;
        var filters;
        beforeEach(function() {

            iconClassArray = [];
            var search = element(by.model('vm.search'));
            search.clear();

            filterButton = $('div.buttons.buttons-right > span > button');

            expect(filterButton.isPresent()).toBe(true);

            filterButton.click();

            expect($('ion-modal-view').isPresent()).toBe(true);
            modalClose = $('ion-modal-view > a.modal-close');
            expect(modalClose.isPresent()).toBe(true);
            filters = element.all(by.repeater('(key, obj) in vm.filters'));

            filters.count().then(function(number) {
                count = number;
            });

            filters.each(function(item, index) {

                if (index < (count - 1)) {
                    var icon = item.$('div.item-content.disable-pointer-events > span.icon');
                    var iconClassName = icon.getAttribute('class').then(function(val) {
                        iconClassArray.push(val);
                    });
                }
            });

            // filters.each(function(ele, index) {
            //     var checkbox = ele.$('.ion-android-checkbox-outline');
            //     expect(checkbox.isPresent()).toBe(true);
            // });

        });

        it('it should filter by category deselecting one filter at time', function() {


            //salva i nomi delle classi delle categorie in un array
            filters.each(function(ele, index) {

                if (index < (count - 1)) {

                    ele.click();
                    expect($('ion-modal-view').isPresent()).toBe(true);
                    modalClose = $('ion-modal-view > a.modal-close');
                    expect(modalClose.isPresent()).toBe(true);
                    modalClose.click();

                    var filteredPackages = element.all(by.repeater('item in vm.packages | categoryFilter : vm.filters | packagesSearchFilter : vm.search'));
                    filteredPackages.each(function(ele, packindex) {
                        var activityIcons = ele.$$("div.content-reduced");
                        var cssSelectors = "." + iconClassArray[index];
                        cssSelectors = cssSelectors.replace(" ", " .");
                        var tmp = cssSelectors.split(" ", 2);
                        var classIcon = activityIcons.$$(tmp[1]);
                        var activities = ele.all(by.repeater("category in item.activity"));
                        activities.count().then(function(count) {

                            if (count == 1) {
                                expect(classIcon.count()).toBe(0);
                            } else if (count > 1) {

                                // expect(classIcon.count()).toBe(0);
                            }

                        });

                    });

                    filterButton = $('div.buttons.buttons-right > span > button');
                    expect(filterButton.isPresent()).toBe(true);
                    filterButton.click();

                    ele.click();
                } else {
                    ele.click();
                    expect($('ion-modal-view').isPresent()).toBe(true);
                    modalClose = $('ion-modal-view > a.modal-close');
                    expect(modalClose.isPresent()).toBe(true);
                    modalClose.click();
                    var fp = element.all(by.repeater('item in vm.packages | categoryFilter : vm.filters | packagesSearchFilter : vm.search'));
                    expect(fp.count()).toEqual(0);
                    filterButton = $('div.buttons.buttons-right > span > button');
                    expect(filterButton.isPresent()).toBe(true);
                    filterButton.click();
                    ele.click();
                    modalClose = $('ion-modal-view > a.modal-close');
                    expect(modalClose.isPresent()).toBe(true);
                    modalClose.click();
                }
            });
        });
    })


});

describe("Select category from Home.", function() {

    var count;
    var iconClassArray = [];
    beforeEach(function() {
        iconClassArray = [];
        expect(browser.getTitle()).toEqual('Webmapp');

        var menu = $$("ion-header-bar >  div.buttons.buttons-left > span > button").get(0);
        menu.click();

        var homeButton = element.all(by.repeater('item in vm.advancedMenuItems')).get(0);
        expect(homeButton.getText()).toBe("Home");
        homeButton.click();

        var categories = element.all(by.repeater("(key, item) in vm.activities"));
        categories.count().then(function(num) {
            count = num;
        })

        categories.each(function(elem, index) {

            elem.$("div> div.home-icon > i").getAttribute("class").then(function(val) {
                iconClassArray.push(val);
            });
        });

    });

    it("it should filter packages selecting one category at time", function() {

        for (let i = 0; i < count; i++) {
            var category = element(by.repeater("(key, item) in vm.activities").row(i));
            var icon = category.$("div> div.home-icon > i");
            category.click();
            var filteredPackages = element.all(by.repeater('item in vm.packages | categoryFilter : vm.filters | packagesSearchFilter : vm.search'));
            filteredPackages.each(function(ele, packindex) {

                var activityIcons = ele.$$("div.content-reduced");
                var cssSelectors = "." + iconClassArray[i];
                cssSelectors = cssSelectors.replace(" ", " .");
                var tmp = cssSelectors.split(" ", 2);
                var classIcon = activityIcons.$$(tmp[1]);

                expect(classIcon.count()).toBe(1);

            });


            var menu = $$("ion-header-bar >  div.buttons.buttons-left > span > button").get(0);
            menu.click();


            var homeButton = element.all(by.repeater('item in vm.advancedMenuItems')).get(0);
            expect(homeButton.getText()).toBe("Home");
            homeButton.click();

        };

    });


});