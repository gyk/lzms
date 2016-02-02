// This file is obsolete. Run `requirejs` task in Gruntfile instead.

// builds into a single file
{
    baseUrl: './scripts',
    include: ['main', 'mineSweeper', 'mineSweeperView', 'timer', 'utility', 
        'jquery', 'underscore'],
    insertRequire: ['main'],  // almond.js doesn't look for data-main
    name: 'almond',
    paths: {
        'jquery': 'jquery'  // uses the local version
    },
    out: 'scripts/require-built.js',  // should be renamed to require.js later
    optimizeCss: 'standard'
}
