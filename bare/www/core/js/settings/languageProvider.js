/*global angular*/
angular.module('webmapp')

.provider('LANGUAGE', function(GENERAL_CONFIG) {
    var config = angular.extend(this, GENERAL_CONFIG);

    if (!!localStorage.language) {
        config = angular.extend(this, JSON.parse(localStorage.language));
    }

    this.getLanguage = function() {
      var language = {};
      if (typeof $window.localStorage.language === 'string') {
        language = JSON.parse($window.localStorage.language);
      }
      return language;
    };
  
    this.setLanguage = function(lang) {
      $window.localStorage.language = JSON.stringify(lang.substring(0,2));
    };

    this.$get = function() {
        return config;
    };
});