define(['underscore'], function (_) {
    // Helper functions
    function create2DArray(nr, nc, defVal) {
        var a = new Array(nr);
        for (var i = 0; i < nr; i++) {
            a[i] = new Array(nc);
            for (var j = 0; j < nc; j++) {
                a[i][j] = defVal;
            }
        }
        return a;
    }

    function random2D(nr, nc, nMines, firstR, firstC) {
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

    // Class definition
    function MineSweeper(config) {
        if (typeof config.level !== typeof undefined) {
            config = this.levels[config.level];
        }
        this.nRows = config.nRows;
        this.nColumns = config.nColumns;
        this.nCells = this.nRows * this.nColumns;
        this.nMines = config.nMines;
        this.game = GameState.SPAWNED;

        this.init();
    }

    var proto = MineSweeper.prototype;

    proto.levels = {
        'Trivial': {
            'nRows': 5,
            'nColumns': 9,
            'nMines': 5
        },
        'Beginner': {
            'nRows': 9,
            'nColumns': 9,
            'nMines': 10
        },
        'Intermediate': {
            'nRows': 16,
            'nColumns': 16,
            'nMines': 40
        },
        'Expert': {
            'nRows': 16,
            'nColumns': 30,
            'nMines': 99
        }
    };

    var State = {
        WALL : 'wall',
        UNKNOWN : 'unknown',
        OPENED : 'opened',
        FLAGGED : 'flagged',
        QUESTIONING : 'questioning'
    };

    var GameState = {
        SPAWNED : 'spawned',
        INTACT : 'intact',
        ALIVE : 'alive',
        DEAD : 'dead',
        WON : 'won'
    };

    proto.init = function () {
        this.reset();
    };

    proto.reset = function () {
        // builds wall around the minefield
        this.minefield = create2DArray(this.nRows + 2, this.nColumns + 2, 0);
        this.neighbors = create2DArray(this.nRows + 2, this.nColumns + 2, 0);
        this.cellStates = create2DArray(this.nRows + 2, this.nColumns + 2, 
            State.UNKNOWN);
        for (var i = 0; i <= this.nRows + 1; i++) {
            this.cellStates[i][0] = this.cellStates[i][this.nColumns + 1] = 
                State.WALL;
        }
        for (var j = 0; j <= this.nColumns + 1; j++) {
            this.cellStates[0][j] = this.cellStates[this.nRows + 1][j] = 
                State.WALL;
        }
        
        this.nHiddenMines = this.nMines;
        this.nUnknownCells = this.nCells;
        this.game = GameState.INTACT;
    };

    proto.calcNeighborCounts = function () {
        for (var i = 0; i <= this.nRows + 1; i++) {
            for (var j = 0; j <= this.nColumns + 1; j++) {
                if (this.minefield[i][j] != 1) continue;
                var nb = this.neighbors;
                nb[i-1][j-1]++;
                nb[i-1][ j ]++;
                nb[i-1][j+1]++;
                nb[ i ][j-1]++;
                nb[ i ][j+1]++;
                nb[i+1][j-1]++;
                nb[i+1][ j ]++;
                nb[i+1][j+1]++;
            }
        }
    };

    proto.layMines = function (firstR, firstC) {
        var positions = random2D(this.nRows, this.nColumns, 
            this.nMines, firstR, firstC);
        var _this = this;
        _.map(positions, function (pos) {
            _this.minefield[pos[0]][pos[1]] = 1;
        });
        this.calcNeighborCounts();
    };

    proto.open = function (r, c) {
        if (this.game == GameState.INTACT) {
            this.firstOpen(r, c);
        }

        if (this.game != GameState.ALIVE) {
            return false;
        }

        var cells = this.cellStates;
        switch (cells[r][c])
        {
        case State.UNKNOWN:
            cells[r][c] = State.OPENED;
            this.nUnknownCells--;
            break;
        case State.OPENED:
            return false;
        case State.FLAGGED:
            return false;
        case State.QUESTIONING:
            cells[r][c] = State.OPENED;
            this.nUnknownCells--;
            break;
        }
        if (this.minefield[r][c]) {
            // Exploded!
            this.game = GameState.DEAD;
        } else if (this.neighbors[r][c] == 0) {
            this.cascade(r, c);
        }
        return true;
    };

    proto.firstOpen = function (r, c) {
        if (this.game != GameState.INTACT) {
            return false;
        }
        // Be aware of the calling order:
        this.layMines(r, c);
        this.game = GameState.ALIVE;
        this.open(r, c);
        return true;
    };

    proto.cascade = function (r, c) {
        if (this.neighbors[r][c] != 0) {
            return;
        }
        var cells = this.cellStates;
        var neighbors = this.neighbors;
        var queue = [];
        queue.push([r, c]);
        while (queue.length > 0) {
            var pos = queue.shift();
            for (var i = -1; i <= 1; i++) {
                for (var j = -1; j <= 1; j++) {
                    var r = pos[0] + i, c = pos[1] + j;
                    if (i == 0 && j == 0 || cells[r][c] == State.WALL) {
                        continue;
                    }

                    if (neighbors[r][c] == 0) {
                        if (cells[r][c] == State.OPENED) {
                            continue;
                        }
                        if (cells[r][c] != State.FLAGGED) {
                            if (cells[r][c] != State.OPENED) {
                                cells[r][c] = State.OPENED;
                                this.nUnknownCells--;
                            }
                        }
                        queue.push([r, c]);
                    } else {
                        console.assert(this.minefield[r][c] == 0, 
                            "Mine is not expected here");
                        if (cells[r][c] != State.FLAGGED) {
                            if (cells[r][c] != State.OPENED) {
                                cells[r][c] = State.OPENED;
                                this.nUnknownCells--;
                            }
                        }
                    }
                }
            }
        }
    };

    // If the surrounding mines of a cell have been flagged, 
    // we can open the remaining unknown ones.
    proto.openRest = function (r, c) {
        var cells = this.cellStates;
        if (cells[r][c] != State.OPENED) {
            return false;
        };
        var nFlagged = 0;
        for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
                if (cells[r + i][c + j] == State.FLAGGED) {
                    nFlagged += 1;
                }
            }
        }
        if (nFlagged == this.neighbors[r][c]) {
            for (var i = -1; i <= 1; i++) {
                for (var j = -1; j <= 1; j++) {
                    if (cells[r + i][c + j] == State.UNKNOWN) {
                        this.open(r+i, c+j);
                    }
                }
            }
        }
        return true;
    };

    proto.reveal = function () {
        for (var i = 1; i <= this.nRows; i++) {
            for (var j = 1; j <= this.nColumns; j++) {
                this.cellStates[i][j] = State.OPENED;
            }
        }
        this.game = GameState.DEAD;
    };

    proto.flag = function (r, c) {
        if (this.game != GameState.ALIVE) {
            return false;
        }

        var cells = this.cellStates;
        switch (cells[r][c])
        {
        case State.UNKNOWN:
            cells[r][c] = State.FLAGGED;
            this.nHiddenMines--;
            this.nUnknownCells--;
            return true;
            break;
        case State.OPENED:
            return false;
            break;
        case State.FLAGGED:
            cells[r][c] = State.QUESTIONING;
            this.nHiddenMines++;
            this.nUnknownCells++;
            return true;
            break;
        case State.QUESTIONING:
            cells[r][c] = State.UNKNOWN;
            return true;
            break;
        }
    };

    // Minefield representation in ASCII
    proto.ascii = function () {
        var s = "";
        cells = this.cellStates;
        with (this) {
            for (var i = 1; i <= this.nRows; i++) {
                var line = "";
                for (var j = 1; j <= this.nColumns; j++) {
                    if (cells[i][j] == State.OPENED) {
                        if (minefield[i][j]) {
                            line += "*";
                        } else {
                            line += neighbors[i][j].toString();
                        }
                    } else if (cells[i][j] == State.UNKNOWN) {
                        line += "_";
                    } else if (cells[i][j] == State.FLAGGED) {
                        line += "F";
                    } else if (cells[i][j] == State.QUESTIONING) {
                        line += "?";
                    }
                    line += " ";
                }
                s += line + "\n";
            }
        }
        return s + "\n";
    };

    proto.print = function (printer) {
        if (printer === undefined) {
            printer = console.log.bind(console);
        }
        printer(this.ascii());
    };

    proto.printMineStat = function () {
        console.log("[* = " + this.nHiddenMines.toString() + ", _ = " + 
            this.nUnknownCells.toString() + "]");
    };

    // For playing in REPL. Just issue the command:
    // 
    //     node debug main.js
    // 
    // then press 'c' and type 'repl', we can play the game 
    // in the console.
    proto.interact = function () {
        // Shortcuts
        var ms = this;
        var _check = function () {
            if (ms.game == GameState.DEAD) {
                console.log('GAME OVER');
                ms.reveal();
                ms.print();
                ms.reset();
                console.log('New Game:');
            } else if (ms.nUnknownCells == 0) {
                console.log('YOU WIN');
                ms.reset();
                console.log('New Game:');
            }
        };
        var o = function (r, c) {
            ms.open(r, c);
            p();
            _check();
        };
        var f = function (r, c) {
            ms.flag(r, c);
            p();
            _check();
        };
        var or = function (r, c) {
            ms.openRest(r, c);
            p();
            _check();
        };
        var p = function () {
            ms.print();
            ms.printMineStat();
        };

        debugger;
    }

    return MineSweeper;
});
