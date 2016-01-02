define(['underscore', 'utility'], function (_, utility) {
    var create2DArray = utility.create2DArray;
    var random2D = utility.random2D;

    function forNeighbors(r, c, fun) {
        fun(r-1, c-1);
        fun(r-1,  c );
        fun(r-1, c+1);
        fun( r , c-1);
        fun( r , c+1);
        fun(r+1, c-1);
        fun(r+1,  c );
        fun(r+1, c+1);
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
        this.beLazy = true;

        this.onOpening = undefined;
        this.onFlagging = undefined;

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
            'nRows': 16,
            'nColumns': 16,
            'nMines': 40
        },
        'Intermediate': {
            'nRows': 16,
            'nColumns': 30,
            'nMines': 99
        },
        'Expert': {
            'nRows': 20,
            'nColumns': 30,
            'nMines': 149
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

    // exports static members
    MineSweeper.State = State;
    MineSweeper.GameState = GameState;

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
        var neighbors = this.neighbors;
        for (var r = 0; r <= this.nRows + 1; r++) {
            for (var c = 0; c <= this.nColumns + 1; c++) {
                if (this.minefield[r][c] != 1) continue;
                forNeighbors(r, c, function (i, j) {
                    neighbors[i][j]++;
                });
            }
        }
    };

    // NOTE: we can manipulate mine generation for a more interesting game
    // to play. However, it would be impossible to use probability to 
    // analyze the board if the layout were not generated randomly.
    proto.layMines = function (firstR, firstC) {
        var positions = random2D(this.nRows, this.nColumns, 
            this.nMines, firstR, firstC);
        var _this = this;
        _.map(positions, function (pos) {
            _this.minefield[pos[0]][pos[1]] = 1;
        });
        this.calcNeighborCounts();
    };

    proto._open = function (r, c) {
        if (this.game != GameState.ALIVE) {
            return false;
        }

        var cells = this.cellStates;
        switch (cells[r][c])
        {
        case State.UNKNOWN:
            cells[r][c] = State.OPENED;
            if (this.onOpening !== undefined) {
                this.onOpening(r, c);
            }
            this.nUnknownCells--;
            break;
        case State.OPENED:
        case State.WALL:
            return false;
        case State.FLAGGED:
            return false;
        case State.QUESTIONING:
            cells[r][c] = State.OPENED;
            if (this.onOpening !== undefined) {
                this.onOpening(r, c);
            }
            this.nUnknownCells--;
            break;
        }

        if (this.minefield[r][c]) {
            // Exploded!
            this.game = GameState.DEAD;
        }
        return true;
    };

    proto.open = function (r, c) {
        if (this.game == GameState.INTACT) {
            this.firstOpen(r, c);
            return;
        }

        var hasOpened = this._open(r, c);
        if (!hasOpened) return false;

        if (this.beLazy) {
            this.lazy(r, c);
        } else if (this.game == GameState.ALIVE && this.neighbors[r][c] == 0) {
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

        // trying to make a cascade opening
        if (this.beLazy && this.neighbors[r][c] > 0) {
            var _this = this;
            var nMoves = 10;
            var nTrials = 5;
            for (var i = 1; i <= nTrials; i++) {
                var positions = random2D(this.nRows, this.nColumns, 
                    nMoves, r, c);

                positions = _.filter(positions, function (pos) {
                    return _this.minefield[pos[0]][pos[1]] == 0;
                });

                var firstEmptyInd = _.findIndex(positions, function (pos) {
                    return _this.neighbors[pos[0]][pos[1]] == 0;
                });

                if (firstEmptyInd == -1) {
                    if (i < nTrials) {
                        continue;
                    }
                } else {
                    positions = positions.slice(0, firstEmptyInd + 1);
                }

                _.map(positions, function (pos) {
                    _this.open(pos[0], pos[1]);
                });
                break;
            }
        }

        return true;
    };

    proto.cascade = function (r, c) {
        // Lazy mode allows cells being opened recursively by its nature, 
        // therefore we do not need cascade expanding.
        if (this.beLazy) return;

        var _this = this;
        var queue = [];
        var push0 = function (i, j) {
            if (_this.neighbors[i][j] == 0) {
                queue.push([i, j]);
            }
        }
        push0(r, c);
        while (queue.length > 0) {
            var pos = queue.shift();
            forNeighbors(pos[0], pos[1], function (i, j) {
                console.assert(_this.minefield[r][c] == 0, 
                    "Mine is not expected here");
                if (_this._open(i, j)) {
                    push0(i, j);
                }
            });
        }
    };

    // If the surrounding mines of a cell have been flagged, 
    // we can open the remaining unknown ones.
    proto.openRest = function (r, c) {
        console.assert(!this.beLazy, "Cannot call openRest in lazy mode");
        var cells = this.cellStates;
        if (cells[r][c] != State.OPENED) {
            return false;
        };
        var nFlagged = 0;
        forNeighbors(r, c, function (i, j) {
            if (cells[i][j] == State.FLAGGED) {
                nFlagged += 1;
            }
        });
        
        var _this = this;
        if (nFlagged == this.neighbors[r][c]) {
            forNeighbors(r, c, function (i, j) {
                if (cells[i][j] == State.UNKNOWN) {
                    _this.open(i, j);
                }
            });
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

    proto._flag = function (r, c) {
        if (this.game != GameState.ALIVE) {
            return false;
        }

        var cells = this.cellStates;
        switch (cells[r][c])
        {
        case State.UNKNOWN:
            cells[r][c] = State.FLAGGED;
            if (this.onFlagging !== undefined) {
                this.onFlagging(r, c);
            }
            this.nHiddenMines--;
            this.nUnknownCells--;
            return true;
            break;
        case State.OPENED:
        case State.WALL:
            return false;
            break;
        case State.FLAGGED:
            cells[r][c] = State.QUESTIONING;
            if (this.onFlagging !== undefined) {
                this.onFlagging(r, c);
            }
            this.nHiddenMines++;
            this.nUnknownCells++;
            return flase;
            break;
        case State.QUESTIONING:
            cells[r][c] = State.UNKNOWN;
            if (this.onFlagging !== undefined) {
                this.onFlagging(r, c);
            }
            return false;
            break;
        }
    };

    proto.flag = function (r, c) {
        if (this._flag(r, c)) {
            if (this.beLazy) {
                this.lazy(r, c);
            }
        }
    };

    /* The Lazy Way */
    proto.lazy = function (r, c) {
        var _this = this;
        var queue = [[r, c, true]];
        var closedList = {};
        while (queue.length > 0) {
            var t = queue.shift();
            var pos = [t[0], t[1]];

            // If the dequeued cell has just been opened or flagged 
            // (a.k.a. state changed), all of its neighbors should be 
            // enqueued. Otherwise, we check whether it is clear that 
            // the surrounding unrevealed cells are mines/non-mines. If 
            // we are sure, open/flag them and then enqueue them. 
            var stateChanged = t[2];
            var r = pos[0], c = pos[1];

            var clear = this.isClear(r, c);
            if (clear === undefined) {  // no need to open unknown cells
                if (stateChanged) {
                    forNeighbors(r, c, function (i, j) {
                        if ((_this.cellStates[i][j] != State.OPENED && 
                            _this.cellStates[i][j] != State.FLAGGED) || 
                            [i, j] in closedList) {
                            return;
                        }
                        queue.push([i, j, false]);
                    });
                }
                continue;
            }

            if (clear == 0) {
                forNeighbors(r, c, function (i, j) {
                    if ([i, j] in closedList) return;
                    var opened = _this._open(i, j);
                    if (opened || stateChanged) {
                        queue.push([i, j, opened]);
                    }
                });
            } else if (clear == 1) {
                forNeighbors(r, c, function (i, j) {
                    if ([i, j] in closedList) return;
                    var flagged;
                    if (_this.cellStates[i][j] == State.UNKNOWN) {
                        _this._flag(i, j);
                        flagged = true;
                    }
                    if (flagged || stateChanged) {
                        queue.push([i, j, flagged]);
                    }
                });
            }
            closedList[pos] = true;  // this cell is done
        }
    };

    // Suppose the player's flagging is correct, checks whether we can  
    // determine the surrounding unrevealed cells are all mines/non-mines.
    // Returns: 1, if all the remaining cells are mines;
    //          0, if all of them are non-mines;
    //          undefined, if not sure or all cells have already been opened.
    proto.isClear = function (r, c) {
        var cells = this.cellStates;
        // we cannot see neighbor counts of flagged cells
        if (cells[r][c] != State.OPENED) {
            return undefined;
        }

        var nMines = this.neighbors[r][c];
        var nUnknown = 0, nFlagged = 0;
        forNeighbors(r, c, function (i, j) {
            if (cells[i][j] == State.UNKNOWN) {
                nUnknown++;
            } else if (cells[i][j] == State.FLAGGED) {
                nFlagged++;
            }
        });

        if (nUnknown == 0) return undefined;
        if (nMines == 0) {
            return 0;
        } else if (nMines == nFlagged) {
            return 0;
        } else if (nMines - nFlagged == nUnknown) {
            return 1;
        }
        return undefined;
    };

    proto.checkWinning = function () {
        var hasWon = this.game == GameState.ALIVE && this.nUnknownCells == 0 && 
            this.nHiddenMines == 0;
        if (hasWon) {
            this.game = GameState.WON;
        }
        return hasWon;
    };

    // Minefield representation in ASCII
    proto.ascii = function () {
        var s = "";
        var cells = this.cellStates;
        for (var i = 1; i <= this.nRows; i++) {
            var line = "";
            for (var j = 1; j <= this.nColumns; j++) {
                if (cells[i][j] == State.OPENED) {
                    if (this.minefield[i][j]) {
                        line += "*";
                    } else {
                        line += this.neighbors[i][j].toString();
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
        if (ms.beLazy) {
            console.log('Lazy Mode ON');
        }

        var _check = function () {
            if (ms.game == GameState.DEAD) {
                console.log('GAME OVER');
                ms.reveal();
                ms.print();
                ms.reset();
                console.log('New Game:');
            } else if (ms.checkWinning()) {
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
