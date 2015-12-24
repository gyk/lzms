// for Node.js REPL
if (typeof requirejs === typeof undefined) {
    var requirejs = require('requirejs');
}

requirejs.config({
    paths: {
        'jquery': 'jquery', 
        'underscore': 'underscore'
    }
});

requirejs(['underscore', 'mineSweeper'], function (_, MineSweeper) {
    // Optional dependency on jQuery
    requirejs(['jquery'], function ($) {
        $('#start-game').click(function (ev) {
            $('#start-game').after('<div id="game"></div>');
        });
    }, function (err) {
        if (typeof window !== typeof undefined) {
            throw new Error("Failed to load jQuery");
        }

        requirejs.undef('jquery');
        var ms = new MineSweeper({level: "Trivial"});
        ms.print();
        ms.interact();
    });
});
