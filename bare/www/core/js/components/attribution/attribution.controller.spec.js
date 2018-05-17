describe("It bello", function () {
    // var $controller;

    beforeEach(module('webmapp'));
    // beforeEach(function (_$controller_) {
    //     $controller = _$controller_('AttributionController');
    // });

    it('should be bello', inject(function ($controller) {
        var attributionCtrl = $controller('AttributionController');
        expect(attributionCtrl.title).toBeDefined();
    }));
});