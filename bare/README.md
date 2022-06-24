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

> `duplicate symbol '_CMEmptyAddress'`? then reinstall `uk.co.workingedge.phonegap.plugin.launchnavigator`and reinstall platform ios
> use ios@5 and android@7
> for android remove phonegap-plugin-barcodescanner and cordova-plugin-compat

On new version of android (9+) communication over http is forbidden by default, you have to override this config.
ensure that in AndroidManifest.xml is present:
<manifest ...>
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        ...
        android:usesCleartextTraffic="true"
        ...>
        ...
    </application>
</manifest>
