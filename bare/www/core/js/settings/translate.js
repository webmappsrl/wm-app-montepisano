angular.module('webmapp')

.config(function ($translateProvider) {
	$translateProvider.preferredLanguage('it_IT');
	$translateProvider.useLoader('Languages');
});