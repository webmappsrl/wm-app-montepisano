describe('Auth.Factory Test', function () {
    beforeEach(module('webmapp'));

    var authService;
    var MapService;
    var db = {};
    beforeEach(inject(function (Auth, _MapService_) {
        authService = Auth;
        MapService = _MapService_;
    }));
    beforeEach(function () {

        spyOn(MapService, 'setItemInLocalStorage').and.callFake(function (key, value) {
            db[key] = value;
        });
        spyOn(MapService, 'getItemFromLocalStorage').and.callFake(function (value) {
            var deferred = $q.defer();

            if (db[key]) {
                deferred.resolve(db[key])
            } else {
                deferred.reject({});
            }

            return deferred;
        })

        spyOn(MapService, 'removeItemFromLocalStorage').and.callFake(function (value) {
            delete db[value];
        })
    })
    describe('Auth.Factory.setUserData', function () {
        it('Should set user data successfully', function () {
            var data = {
                user: 'user',
                pass: 'pass',
                mail: 'user',
                appname: 'appname',
                first_name: 'first_name',
                last_name: 'last_name',
                newsletter: 'newsletter',
                country: 'country'
            };
            var value = JSON.stringify(data)

            authService.setUserData(data);
            expect(MapService.setItemInLocalStorage).toHaveBeenCalledWith("$wm_userData", value);


        });
    });

    describe('Auth.Factory.resetUserData', function () {
        it('Should reset user data successfully', function () {
            authService.resetUserData();
            expect(MapService.removeItemFromLocalStorage).toHaveBeenCalledWith("$wm_userData");
        });
    });

    describe('Auth.Factory.getUserData', function () {
        it('Should return user data successfully', function () {
            var udata = {
                user: 'user',
                pass: 'pass',
                mail: 'user',
                appname: 'appname',
                first_name: 'first_name',
                last_name: 'last_name',
                newsletter: 'newsletter',
                country: 'country'
            };
            authService.setUserData(udata);
            var data = authService.getUserData();

            expect(udata).toEqual(data);
        });
    });

    describe('Auth.Factory.isLoggedIn', function () {
        it('user is not logged  =>Should return false', function () {
            var udata = {
                user: 'user',
                pass: 'pass',
                mail: 'user',
                appname: 'appname',
                first_name: 'first_name',
                last_name: 'last_name',
                newsletter: 'newsletter',
                country: 'country'
            };
            authService.resetUserData("$wm_userData");
            expect(authService.isLoggedIn()).toBe(false);
        });

        it('user is logged =>Should return true', function () {
            var udata = {
                user: 'user',
                pass: 'pass',
                mail: 'user',
                appname: 'appname',
                first_name: 'first_name',
                last_name: 'last_name',
                newsletter: 'newsletter',
                country: 'country',
                ID: '0'
            };
            authService.setUserData(udata);
            expect(authService.isLoggedIn()).toBe(true);
        });
    });
});