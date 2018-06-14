describe('Account.Factory', function() {


    beforeEach(module('webmapp'));

    var accountService;
    var $httpBackend;
    var $q;
    var $rootScope;
    beforeEach(inject(function(Account, _$httpBackend_, _$q_, _$rootScope_) {
        accountService = Account;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        $q = _$q_;

    }));

    describe('Account.Factory.login', function() {

        it('it should execute login successfully', function() {
            // var fakeUser = 'fakeUser';
            // var fakePass = 'fakePass';
            // var data = {
            //     user: fakePass,
            //     pass: fakeUser
            // };

            // $httpBackend.whenGET().respond(404);
            // console.log(accountService.baseUrl + accountService.endpoint + 'user/');
            // $httpBackend.when('POST', accountService.baseUrl + accountService.endpoint + 'user/').respond(200, ["ResponseOK"]);
            // accountService.login(fakeUser, fakePass).then(function(response) {

            //     expect(response.data.lenght).toBe('ResponseOK');

            // }).catch(function(err) {
            //     console.log(err);
            // });
            // $httpBackend.flush();

        })




    });


});