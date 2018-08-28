describe('Auth.Factory Test', function () {
    beforeEach(module('webmapp'));

    var authService;

    beforeEach(inject(function (Auth) {
        authService = Auth;
    }));

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
            authService.setUserData(data);
            var obj = JSON.parse(window.localStorage.user);

            expect(obj).toEqual(data);
        });
    });

    describe('Auth.Factory.resetUserData', function () {
        it('Should reset user data successfully', function () {
            authService.resetUserData();
            expect(localStorage.user).toBeUndefined();
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
            localStorage.user = JSON.stringify(udata);
            var data = authService.getUserData();

            expect(udata).toEqual(data);
        });
    });

    describe('Auth.Factory.isLoggedIn', function () {
        it('localStorage.user is object  && user.ID is undefined =>Should return false', function () {
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
            localStorage.user = JSON.stringify(udata);

            expect(authService.isLoggedIn()).toBe(false);
        });

        it('localStorage.user is object  && user.ID is defined =>Should return true', function () {
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
            localStorage.user = JSON.stringify(udata);

            expect(authService.isLoggedIn()).toBe(true);
        });
    });
});
