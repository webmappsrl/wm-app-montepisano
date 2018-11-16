angular.module('webmapp')

	.config(function (
		$translateProvider,
		$windowProvider,
		CONFIGProvider
	) {
		var lang = "it";
		var $window = $windowProvider.$get();

		var userLang = navigator.language || navigator.userLanguage;
		userLang = userLang.substring(0, 2);

		if (CONFIGProvider.LANGUAGES) {
			var found = false;
			if (CONFIGProvider.LANGUAGES.available) {
				for (var i in CONFIGProvider.LANGUAGES.available) {
					if (CONFIGProvider.LANGUAGES.available[i].substring(0, 2) === userLang) {
						lang = userLang;
						found = true;
						break;
					}
				}
			}

			if (!found) {
				if (CONFIGProvider.LANGUAGES.actual) {
					lang = CONFIGProvider.LANGUAGES.actual.substring(0, 2);
				}
				else {
					lang = "it";
				}
			}
		}

		var currentLang = $window.localStorage.language ? JSON.parse($window.localStorage.language) : null;
		if (currentLang) {
			lang = currentLang;
		}

		$translateProvider.useSanitizeValueStrategy('sanitizeParameters');
		$translateProvider.registerAvailableLanguageKeys(['en', 'it', 'de', 'fr'], {
			'en-*': 'en',
			'it-*': 'it',
			'de-*': 'de',
			'fr-*': 'fr',
			'en_*': 'en',
			'it_*': 'it',
			'de_*': 'de',
			'fr_*': 'fr',
			'*': 'en'
		});
		$translateProvider.useStaticFilesLoader({
			prefix: 'core/languages/locale-',
			suffix: '.json'
		});

		$translateProvider.preferredLanguage(lang);
		$window.localStorage.language = JSON.stringify(lang);
	});
