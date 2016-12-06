var gulp = require('gulp'),
    del = require('del');

gulp.task('clean', function () {
    return del(['./dist/']);
});

gulp.task('default', ['clean'], function () {
    gulp.start('html', 'img', 'font', 'css', 'js', 'webpack');
});

