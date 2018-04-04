angular.module('webmapp')

.config(function (
	$translateProvider,
	$windowProvider,
	CONFIGProvider
) {
	var lang = "";
	var $window = $windowProvider.$get();

	var userLang = navigator.language || navigator.userLanguage; 
	userLang = userLang.substring(0, 2);

	if (CONFIGProvider.LANGUAGES) {
		if (CONFIGProvider.LANGUAGES.available) {
			for (var i in CONFIGProvider.LANGUAGES.available) {
				if (CONFIGProvider.LANGUAGES.available[i].substring(0, 2) === userLang) {
					lang = userLang;
					break;
				}
			}
		}
		if (lang === "" && CONFIGProvider.LANGUAGES.actual) {
			lang = CONFIGProvider.LANGUAGES.actual.substring(0, 2);
		}
		else if (lang === "" && !CONFIGProvider.LANGUAGES.actual) {
			lang = "it";
		}
	}

	var currentLang = $window.localStorage.language ? JSON.parse($window.localStorage.language) : null;
	if (currentLang) {
		lang = currentLang;
	}

	$translateProvider.useSanitizeValueStrategy('sanitizeParameters');
	$translateProvider.registerAvailableLanguageKeys(['en', 'de', 'it'], {
	
	 'en-*': 'en',
	 'it-*': 'it',
	 'en_*': 'en',
	 'it_*': 'it',
	 '*': 'en',
	 
	});
	$translateProvider.useStaticFilesLoader({
	 prefix: 'core/languages/locale-',
	 suffix: '.json'
	});

	$translateProvider.preferredLanguage(lang);
});