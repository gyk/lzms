// for Node.js REPL
if (typeof requirejs === typeof undefined) {
    var requirejs = require('requirejs');
}

requirejs.config({
    paths: {
        'underscore': 'underscore'
    }
});

requirejs(['underscore', 'mineSweeper'], function (_, MineSweeper) {
    var ms = new MineSweeper({level: "Trivial"});
    ms.print();
    ms.interact();
});
