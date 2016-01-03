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
        var ms = undefined,
            msv = undefined;
        $('#start-game').dblclick(function (ev) {
            if (ms === undefined || msv === undefined) {
                ms = new MineSweeper({level: "Intermediate"});
                msv = new MineSweeperView(ms);
            }
            
            $('#explorer').hide();
            $('#game').css('display', 'inline-block');
        });

        $('#cap-minimize').click(function (ev) {
            $('#game').css('display', 'none');
            $('#explorer').show();
        });

        $('#cap-control').dblclick(function (ev) {
            ms = undefined;
            msv = undefined;
            $('#game').css('display', 'none');
            $('#explorer').show();
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
