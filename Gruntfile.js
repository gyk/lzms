module.exports = function(grunt) {
  grunt.initConfig({
    copy: {
      files: {
        src: ['*.html', 'images/*'],
        dest: 'dist/',
        filter: 'isFile'
      }
    },
    requirejs: {
      compile: {
        options: {
          baseUrl: './scripts',
          include: [
            'main', 'mineSweeper', 'mineSweeperView', 'timer', 'utility', 
            'jquery', 'underscore'
          ],
          insertRequire: ['main'],  // almond.js doesn't look for data-main
          name: 'almond',
          paths: {
            'jquery': 'jquery'  // uses the local version
          },
          out: 'dist/scripts/require.js'  // should be renamed to require.js later
        }
      }
    },
    cssmin: {
      options: {
        roundingPrecision: -1
      },
      target: {
        files: [{
          expand: true,
          cwd: 'styles',
          src: '*.css',
          dest: 'dist/styles/',
          ext: '.css'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['copy', 'requirejs', 'cssmin']);
}
