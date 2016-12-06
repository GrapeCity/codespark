var gulp = require('gulp'),
    rename = require("gulp-rename"),
    del = require('del'),
    imagemin = require('gulp-imagemin'),
    webpack = require('gulp-webpack');

gulp.task('clean', function () {
    return del(['./dist/']);
});

gulp.task('html', function () {
    return gulp.src('./src/*.zh-CN.html')
        .pipe(rename(function (p) {
            p.basename = p.basename.substr(0, p.basename.length - 6);
            return p;
        }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('img', function () {
    return gulp.src('./src/img/**/*')
        .pipe(imagemin({optimizationLevel: 5, progressive: true, interlaced: true}))
        .pipe(gulp.dest('./dist/img/'));
});

gulp.task('font', function () {
    return gulp.src('./src/fonts/*')
        .pipe(gulp.dest('./dist/fonts/'));
});

gulp.task('css', function () {
    return gulp.src('./src/css/*.css')
        .pipe(gulp.dest('./dist/css/'));
});

gulp.task('sass', function () {
    return gulp.src('./src/sass/**/**')
        .pipe(gulp.dest('./dist/sass/'));
});

gulp.task('js', ['sass'], function () {
    return gulp.src('./src/js/*.min.js')
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('webpack', function () {
    return gulp.src('./src/js/index.js', {base: './'})
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('default', ['clean'], function () {
    gulp.start('html', 'img', 'font', 'css', 'js', 'webpack');
});

gulp.task('watch', ['default'], function () {
    gulp.watch('src/*.html', ['html']);
    gulp.watch('src/img/**', ['img']);
    gulp.watch('src/fonts/**', ['font']);
    gulp.watch('src/css/*.css', ['css']);
    gulp.watch('src/js/*.min.js', ['js']);
    gulp.watch(['src/js/*.js', '!src/js/*.min.js'], ['webpack']);
});
