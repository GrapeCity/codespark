# codespark static website

This is a single-page web page built on standard HTML5 features

# stack
* HTML5
* jQuery
* Bootstrap 3.x
* React
* Webpack (scripts building)
* Gulp (build process manager)

# project structure
```
+- site
  +- dist          (project output)
  +- node_modules  (3rd-party dependencies)
  +- src
    +- css         (css source file, include 3rd-parties)
    +- fonts       (fontawesome fonts)
    +- img         (images, will be optimized by imagemin with level=3)
    +- js          (javascript files, include-3rd parties)
    +- sass        (3rd-party sass files)
    |- index.zh-CN.html
  |- gulpfiles.js
  |- package.json
  |- webpack.config.js
```

# how to build
* make sure install nodejs 4.x (or above) and npm 3.x (or above)
* switch to site folder as working folder
* install dependencies (devDependencies only in this project):
```
$ npm i
```
* install gulp to global: 
```
$ npm i gulp -g
```
(otherwise you need point out your gulp executable with full path)
* run gulp default task to build project: 
```
$ gulp
```
* (optional) run gulp watch task to watch developments files with auto rebuild: 
```
$ gulp watch
```