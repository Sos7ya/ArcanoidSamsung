const { src, dest, watch, series, parallel } = require("gulp");
const uglify = require('gulp-uglify');
const babel = require("gulp-babel");
const concat = require('gulp-concat');

const buildBundle = ()=> {
    return src([
        'src/*.js'
    ])

    .pipe(concat('arcanoid.js'))
    .pipe(babel({
        presets:["@babel/preset-env"]
    }))
    .pipe(uglify())
    .pipe(dest('.'))
   
}

const buildLibs = () =>{
    return src([
        'libs/*.js'
    ])
    .pipe(concat('libs.js'))
    .pipe(babel({
        presets: ["@babel/preset-env"]
    }))
    .pipe(uglify())
    .pipe(dest('.'))
}

const observer = () =>{
    watch('src/*.js', {usePolling: true}, buildBundle)
}

exports.default = series(buildLibs, buildBundle, observer)