var gulp = require('gulp'),
	clean = require('gulp-clean'),
	rename = require("gulp-rename"),
	iconfont = require('gulp-iconfont'),
	consolidate = require('gulp-consolidate');
var runTimestamp = Math.round(Date.now()/1000);

/** Config vars **/
var fontName = 'loopIconFont';
var ressourcesDir = 'resource?type=font&name=urn:themes/fonts/loopIconFont/loopIconFont.woff&ext=woff'
var cssPrefix = 'loop';
var cssDstDir = '../fonts/';

gulp.task('CleanIcons', function(){
	return gulp.src('workDir/*.svg').pipe(clean()); //Clean workDir
});

gulp.task('MoveIcons', ['CleanIcons'], function(){
	return gulp.src('icons/*.svg').pipe(gulp.dest('workDir/')); //Copy icons to workDir
});


gulp.task('GenerateFont', ['MoveIcons'], function(){
  return gulp.src(['workDir/*.svg'])
    .pipe(iconfont({
		fontName: fontName, // required 
		appendUnicode: true, // recommended option 
		formats: ['ttf', 'eot', 'woff'], // default, 'woff2' and 'svg' are available 
		timestamp: runTimestamp, // recommended to get consistent builds when watching files 
		normalize: true
	}))
    .on('glyphs', function(glyphs, options) {

		gulp.src('templates/font-style.css')
        .pipe(consolidate('lodash', {
          glyphs: glyphs,
          fontName: fontName,
          fontPath: ressourcesDir,
          className: cssPrefix
        }))
		.pipe(rename(fontName + '.css'))
        .pipe(gulp.dest('css/'));

		gulp.src('templates/font-exemple.html')
        .pipe(consolidate('lodash', {
          glyphs: glyphs,
          fontName: fontName,
          fontPath: ressourcesDir +'/'+ fontName +'/',
          className: cssPrefix
        }))
		.pipe(rename(fontName + '-exemple.html'))
        .pipe(gulp.dest('exemple/'));		
		
    })
    .pipe(gulp.dest('css/'+ fontName +'/'));
});

gulp.task('MoveCss', ['GenerateFont'], function(){
	return gulp.src(['css/*.css', 'css/'+fontName]).pipe(gulp.dest(cssDstDir)); 
});

gulp.task('Iconfont', ['MoveCss'], function(){
	return gulp.src(['css/'+fontName+'/*']).pipe(gulp.dest(cssDstDir+ '/' + fontName)); 
});