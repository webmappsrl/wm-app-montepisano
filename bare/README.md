# Mappalo-instance-see

## Install

To install the project and be ready to develop you need a few components:

- npm (nodejs >0.9)
- ionic
- cordova

#### Install nodeJS

>     from https://nodejs.org/
>
> or
> brew install nodejs

#### Install cordova, ionic

>     npm install -g cordova ionic

#### Install bower

> npm install -g bower

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

# KNOWN PROBLEMS

> Use npm v10+ to build resources
> `duplicate symbol '_CMEmptyAddress'`? then reinstall `uk.co.workingedge.phonegap.plugin.launchnavigator` (with --variable GOOGLE_API_KEY_FOR_ANDROID="", don't worry for errors) and reinstall platform ios
> before installing android platform remove plugin cordova-android-support-gradle-release and reinstall it after platform installation
> use ios@5.1.1+ and android@7.1.4+
> for android remove phonegap-plugin-barcodescanner and cordova-plugin-compat
