angular.module('webmapp')

.config(function (
	$translateProvider,
	CONFIGProvider
) {
	var lang = "it";

	var userLang = navigator.language || navigator.userLanguage; 
	userLang = userLang.substring(0, 1);

	if (CONFIGProvider.LANGUAGES) {
		// if (CONFIGProvider.LANGUAGES.available)
		if (CONFIGProvider.LANGUAGES.actual) {
			lang = CONFIGProvider.LANGUAGES.actual;
		}
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