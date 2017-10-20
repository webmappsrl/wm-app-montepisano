angular.module('webmapp')

.config(function (
	$translateProvider,
	$windowProvider,
	CONFIGProvider
) {
	var lang = "it";
	var $window = $windowProvider.$get();

	var userLang = navigator.language || navigator.userLanguage; 
	userLang = userLang.substring(0, 1);

	var getLanguage = function() {
		var language = null;
		if (typeof $window.localStorage.language === 'string') {
				language = JSON.parse($window.localStorage.language);
		}
		return language;
	};

	if (CONFIGProvider.LANGUAGES) {
		// if (CONFIGProvider.LANGUAGES.available)
		if (CONFIGProvider.LANGUAGES.actual) {
			lang = CONFIGProvider.LANGUAGES.actual;
		}
	}

	var currentLang = getLanguage();
	if (currentLang) {
		lang = currentLang;
	}

	$translateProvider.useSanitizeValueStrategy('sanitizeParameters');
	$translateProvider.registerAvailableLanguageKeys(['en', 'de', 'it'], {
	
	 'en-*': 'en',
	 'de-*': 'de',
	 'it-*': 'it',
	 'en_*': 'en',
	 'de_*': 'de',
	 'it_*': 'it',
	 '*': 'en',
	 
	});
	$translateProvider.useStaticFilesLoader({
	 prefix: 'core/languages/locale-',
	 suffix: '.json'
	});

	$translateProvider.preferredLanguage(lang);
});