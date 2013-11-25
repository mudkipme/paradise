module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    less: {
      production: {
        options: {
          cleancss: true
        },
        files: {
          'public/stylesheets/main.css': 'public/stylesheets/main.less'
        }
      }
    },
    requirejs: {
      production: {
        options: {
            baseUrl: 'public/javascripts',
            name: '../components/almond/almond',
            mainConfigFile: 'public/javascripts/main.js',
            include: ['main'],
            insertRequire: ['main'],
            out: 'public/javascripts/main-built.js',
            optimize: 'uglify2'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask('production',
    'Build static files for production.',
    ['less:production', 'requirejs:production']);

  grunt.registerTask('default', ['production']);
};