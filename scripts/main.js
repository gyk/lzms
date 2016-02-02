// for Node.js REPL
if (typeof requirejs === typeof undefined) {
    var requirejs = require('requirejs');
}

requirejs.config({
    paths: {
        'jquery': [
            'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js',
            'jquery'  // local fallback
        ],
        'underscore': 'underscore'
    }
});

requirejs(['underscore', 'utility', 'mineSweeper'], 
  function (_, utility, MineSweeper) {
    // Optional dependency on jQuery
    requirejs(['jquery', 'mineSweeperView'], 
      function ($, MineSweeperView) {
        var ua = window.navigator.userAgent;
        if (Math.max(ua.indexOf('MSIE '), ua.indexOf('Trident/'), 
            ua.indexOf('Edge/')) > 0) {
            alert('Internet Explorer and Microsoft Edge render SVG ' + 
                'background images poorly due to rasterization. ' + 
                'Please try other browsers for better experience.');
        }

        $(document).ready(function () {
            var msv = undefined;
            $('#start-game').dblclick(function (ev) {
                if (msv === undefined) {
                    msv = new MineSweeperView();
                }
                
                $('#explorer').hide();
                $('#game').css('display', 'inline-block');
            });

            $('#cap-minimize').click(function (ev) {
                $('#game').css('display', 'none');
                $('#explorer').show();
            });

            $('#cap-control').dblclick(function (ev) {
                msv.reset();
                $('#game').css('display', 'none');
                $('#explorer').show();
            });
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
