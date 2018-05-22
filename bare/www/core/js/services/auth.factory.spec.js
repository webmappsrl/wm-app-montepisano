describe('Auth.Factory Test', function() {


    beforeEach(module('webmapp'));

    var authService;

    describe('Auth.Factory.setUserData', function() {

        beforeEach(inject(function(Auth) {
            authService = Auth;
        }));

        it('Should set user data successfully', function() {
            var data = {
                user: 'user',
                pass: 'passowrd',
                mail: 'user',
                appname: 'appname',
                first_name: 'first_name',
                last_name: 'last_name',
                newsletter: 'newsletter',
                country: 'country'
            };

        });




    });


});