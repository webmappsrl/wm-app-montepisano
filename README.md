# wm-app

Webmapp code for mobile (app and webapp).
This software is developed and mantained by WEBMAPP TEAM (see authors). Please fill free to contact us (info@webmapp.it) for any question.

## 1 Getting Started

1. Clone the repo `git clone git@github.com:webmappsrl/wm-app.git` or `git clone https://github.com/webmappsrl/wm-app.git`
2. Run `npm install`

### 1.1 Prerequisites

To run this project you need:
* node.js v8.11.1 and npm v5.6.0 (https://nodejs.org/it/download/)
* ionic v4.7.1 `npm install -g ionic@4.7.1`
* cordove v8.0.0 `npm install -g cordova@8.0.0`

### 1.2 Installing

Firstly, run the following commands into the bare/ directory
 - `ionic cordova plugin add local_plugins/call-number/`
 - `ionic cordova plugin add local_plugins/cordova-sqlite-storage-custom/`

You can also install all the other plugins manually into the bare folder to make the build of new apps faster

#### 1.2.1 Create an instance

Step to create a new instance
1. `gulp build -i [instance_name] {-u [instance_url]}` If -u is not present the url will be http://api.webmapp.it/j/[instance_name].j.webmapp.it/

Then to update the code and the configuration you can run
* `gulp complete-update -i [instance_name] {-u [instance_url]}` If -u is not present the url will be http://api.webmapp.it/j/[instance_name].j.webmapp.it/

#### 1.2.2 WEBAPP

To run the webapp you can choose to:
1. set the app configuration with `gulp set -c [instance_url]` where instance_url can be also a name referring to http://api.webmapp.it/j/[instance_name].j.webmapp.it/
2. run `ionic serve` into the bare/ directory

or

1. create an instance as explained at 1.2.1
2. run `ionic serve` into the /instances/[instance_name] directory created by the previous step

#### 1.2.3 APP

To run the app you need to:
1. create an instance as explained at 1.2.1
2. move to the /instances/[instance_name]/ directory

Then for android do
3. Add android platform `ionic cordova platform add android@6.3.0`
4. Re-add cordova-android-support-gradle-release plugin `ionic cordova plugin rm cordova-android-support-gradle-release` and `ionic cordova plugin add cordova-android-support-gradle-release`
5. Remove cordova-plugin-compat plugin `ionic cordova plugin rm cordova-plugin-compat --force`
6. Build the apk with `ionic cordova build android` or run the apk in the device/emulator with `ionic cordova run android`

For iOS
3. Add iOS platform `ionic cordova platform add ios`
4. Build with `ionic cordova build ios`
5. Open the .project file in /bare/platforms/ios/ with Xcode
6. Run on simulator/device with Xcode

## 2 Running the tests

The testing environment is built with Karma and Jasmine.
To run the unit tests run on the root directory

```
gulp test
```

### 2.1 Break down into end to end tests

### 2.2 And coding style tests

## 3 Deployment

## 4 Built With

* [Ionic](https://ionicframework.com/docs/v1/) - The cross-platform framework to build hybrid mobile app
* [AngularJs](https://angularjs.org/) - The framework used to develop the app
* [Leaflet](https://leafletjs.com/) - The map library
* [Gulp](https://gulpjs.com/) - Used to build apps and automate stuff

## 5 Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## 6 Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

Please refers to the following MAJOR Version schema:

| # | Name        | Year |
|---|-------------|------|
| 1 | Elbrus      | 2019 |
| 2 | Aconcagua   | 2020 |
| 3 | Denali      | 2021 |
| 4 | Everest     | 2022 |
| 5 | Kilimanjaro | 2023 |
| 6 | Carstensz   | 2024 |
| 7 | Vinson      | 2025 |

## 7 Authors

* **Alessio Piccioli** - *CTO* - [Webmapp](https://github.com/webmappsrl)
* **Davide Pizzato** - *Developer* - [Webmapp](https://github.com/webmappsrl)
* **Marco Barbieri** - *Map Maker and UX* - [Webmapp](https://github.com/webmappsrl)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## 8 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## 9 Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc
