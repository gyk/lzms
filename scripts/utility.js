define(['underscore'], function (_) {
    function utility() {};

    // Helper functions
    utility.create2DArray = function (nr, nc, defVal) {
        var a = new Array(nr);
        for (var i = 0; i < nr; i++) {
            a[i] = new Array(nc);
            for (var j = 0; j < nc; j++) {
                a[i][j] = defVal;
            }
        }
        return a;
    }

    utility.random2D = function (nr, nc, nMines, firstR, firstC) {
        // Generates the positions of mines based on the first opened cell.
        var n = nr * nc;
        // 1-based to 0-based
        var firstInd = Math.floor(nc * (firstR - 1) + firstC - 1)
        var indices = _.first(_.shuffle(_.range(firstInd).concat(
            _.range(firstInd + 1, n))), nMines);
        return _.map(indices, function (i) {
            return [Math.floor(i / nc) + 1, i % nc + 1];
        });
    }

    return utility;
});
