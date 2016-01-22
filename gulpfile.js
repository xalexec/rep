var path = require('path');
var fs = require('fs');
var yargs = require('yargs').argv;
var gulp = require('gulp');
var less = require('gulp-less');
var header = require('gulp-header');
var tap = require('gulp-tap');
var nano = require('gulp-cssnano');
var autoprefixer = require('gulp-autoprefixer');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');
var pkg = require('./package.json');

var option = {base: 'src'};
var dist = __dirname + '/dist';
var layout ='';

gulp.task('layout', function () {
    gulp.src(['src/common/layout.html'], option)
        .pipe(tap(function(file){
            var contents = file.contents.toString();
            var dir = path.dirname(file.path);
            contents = contents.replace(/include\('(.*)'\)/gi, function (match, $1) {
                var filename = path.join(dir, $1);
                var content = fs.readFileSync(filename, 'utf-8');
                return content;
            });

            layout = contents;
        }))
})

gulp.task('source',['layout'], function () {
    gulp.src('src/*.html', option)
        .pipe(tap(function (file) {
            var content = fs.readFileSync(file.path, 'utf-8');
            var dir = path.dirname(file.path);
            var o = {};
            content = content.replace(/include\('(.*)'\)/gi, function (match, $1) {
                var filename = path.join(dir, $1);
                var content = fs.readFileSync(filename, 'utf-8');
                return content;
            }).replace(/\{\{(.*):([\s\S}]*?)\}\}/gi, function (match,$1,$2) {
                o[$1]=$2;
                return '';
            });
            o.content = content;
            var out = content;
            if(!o.noLayout)
            {
                out = layout.replace(/\$\{\{(.*?)(?::([\s\S}]*?))?\}\}/gi , function(match,$1,$2){
                    return o[$1]||$2||'';
                })
            }

            file.contents = new Buffer(out);
        }))
        .pipe(gulp.dest(dist))
        .pipe(browserSync.reload({stream: true}));
})


gulp.task('json', function () {
    gulp.src('src/json/*.json', {base: 'src'})
        .pipe(gulp.dest(dist))
        .pipe(browserSync.reload({stream: true}));
})

gulp.task('script', function () {
    gulp.src('src/assets/**.*{js,css,svg,ttf,woff,eof,png,less}', {base: 'src'})
        .pipe(gulp.dest(dist))
        .pipe(browserSync.reload({stream: true}));
})

gulp.task('watch', function () {
    gulp.watch('src/*.html',['source'], function ($1) {
        browserSync.reload();
    });
    gulp.watch('src/**/*.html',['source'], function ($1) {
        browserSync.reload();
    });
    gulp.watch('src/json/*.json',['json'], function ($1) {
        browserSync.reload();
    });
});

gulp.task('server', function () {
    yargs.p = yargs.p || 8080;
    browserSync.init({
        server: {
            baseDir: "./dist"
        },
        ui: {
            port: yargs.p + 1,
            weinre: {
                port: yargs.p + 2
            }
        },
        port: yargs.p,
        startPath: '/'
    });
});


// 参数说明
//  -w: 实时监听
//  -s: 启动服务器
//  -p: 服务器启动端口，默认8080
gulp.task('default', ['source','json'], function () {
    if (yargs.s) {
        gulp.start('server');
    }

    if (yargs.w) {
        gulp.start('watch');
    }
});
