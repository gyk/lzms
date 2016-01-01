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

requirejs(['underscore', 'utility', 'mineSweeper'], 
  function (_, utility, MineSweeper) {
    // Optional dependency on jQuery
    requirejs(['jquery', 'mineSweeperView'], function ($, MineSweeperView) {
        $('#start-game').click(function (ev) {
            var ms = new MineSweeper({level: "Expert"});
            var msv = new MineSweeperView(ms);
            $('#game').css('display', 'inline-block');
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
