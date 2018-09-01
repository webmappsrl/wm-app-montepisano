# Mappalo-instance-see

## Install

To install the project and be ready to develop you need a few components:
* npm (nodejs >0.9)
* ionic
* cordova

#### Install nodeJS
>     from https://nodejs.org/
or
>     brew install nodejs

#### Install cordova, ionic
>     npm install -g cordova ionic

#### Install bower
>    npm install -g bower

#### Install Mappalo
>     npm install
>     bower install
>     ionic state restore

This will install the full toolchain to develop, build and deploy the application.

## Develop
>     ionic serve

# Device test
>     ionic build ios/android
>     ionic emulate ios/android
>     ionic run android

# Plugin to check 
>   ionic cordova plugin add local_plugins/call-number/
>   ionic cordova plugin add local_plugins/cordova-sqlite-storage-custom/
>   ionic cordova plugin add ionic-plugin-deeplinks --variable URL_SCHEME=myeasyroute --variable DEEPLINK_SCHEME=https --variable DEEPLINK_HOST=api.webmapp.it --variable ANDROID_PATH_PREFIX=/
>   ionic cordova plugin add cordova-plugin-inapppurchase
>   ionic cordova plugin add cordova plugin add cordova-plugin-mauron85-background-geolocation@latest
>   ionic cordova plugin add cordova-plugin-device-orientation@2.0.1
>   ionic cordova plugin add com.verso.cordova.clipboard
>   ionic cordova plugin add cordova-plugin-actionsheet
>   ionic cordova plugin add cordova-plugin-device
>   ionic cordova plugin add cordova-plugin-geolocation
>   ionic cordova plugin add cordova-plugin-x-socialsharing
    