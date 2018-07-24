describe('Package.Factory', function() {

    beforeEach(module('webmapp'));

    var PackageService;
    var Auth;
    var Communication;
    var Offline;
    var $httpBackend;
    var $q;
    var $rootScope;
    var $ionicLoading;
    var $ionicModal;
    var $ionicPopup;
    var config;
    var baseUrl, endpoint;
    beforeEach(inject(function(
        _PackageService_,
        _$httpBackend_,
        _$q_,
        _$ionicLoading_,
        _$ionicPopup_,
        _$ionicModal_,
        _$rootScope_,
        _Auth_,
        _Communication_,
        _Offline_,
        _Utils_,
        CONFIG) {

        PackageService = _PackageService_;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        $q = _$q_;
        $ionicLoading = _$ionicLoading_;
        $ionicModal = _$ionicModal_;
        $ionicPopup = _$ionicPopup_;
        Auth = _Auth_;
        Communication = _Communication_;
        Offline = _Offline_;
        Utils = _Utils_;
        config = CONFIG;

        baseUrl = config.COMMUNICATION.baseUrl;
        endpoint = config.COMMUNICATION.endpoint;

        $httpBackend.whenGET().respond(404);

    }));



    describe('getImage', function() {

        it('it should update package image', function() {




        });

    });


    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });



});