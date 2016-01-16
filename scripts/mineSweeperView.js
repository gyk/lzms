define(['jquery', 'utility', 'mineSweeper', 'timer'], 
  function ($, utility, MineSweeper, Timer) {
    var State = MineSweeper.State;
    var GameState = MineSweeper.GameState;

    function MineSweeperView(mineSweeper) {
        if (mineSweeper === undefined) {
            mineSweeper = new MineSweeper({level: "Beginner"});
        }

        // TODO: it would be better to update cells in batch mode.
        mineSweeper.onOpening = this.updateCell.bind(this);
        mineSweeper.onFlagging = this.updateCell.bind(this);

        this.mineSweeper = mineSweeper;
        this.timer = new Timer(this.updateTimer.bind(this), 1000);
        mineSweeper.onFirstOpening = (function () {
            this.timer.start();
        }).bind(this);
        this.init();
    }

    var proto = MineSweeperView.prototype;

    proto.init = function () {
        var _this = this;
        var ms = this.mineSweeper;

        this.cellsView = utility.create2DArray(ms.nRows + 2, ms.nColumns + 2, 
            undefined);
        this.rPressed = -1;
        this.cPressed = -1;

        $('#game-body').empty();
        for (var i = 1; i <= ms.nRows; i++) {
            var row = $('<div>');
            for (var j = 1; j <= ms.nColumns; j++) {
                var aCell = $('<div>');
                aCell.addClass('cell');
                aCell.attr('val', '_');
                aCell.attr('r', i).attr('c', j);

                aCell.mousedown(function (evt) {
                    if (evt.which != 1) return;

                    var r = parseInt($(this).attr('r')),
                        c = parseInt($(this).attr('c'));
                    if (ms.cellStates[r][c] != State.UNKNOWN) {
                        return;
                    }

                    switch (ms.game) {
                    case GameState.SPAWNED:
                    case GameState.INTACT:
                    case GameState.ALIVE:
                        $('#face').attr('emoticon', ':o');
                        $(this).attr('val', '0');
                        _this.rPressed = r;
                        _this.cPressed = c;
                        break;
                    }
                });
                aCell.mouseup(function (evt) {
                    var r = parseInt($(this).attr('r')),
                        c = parseInt($(this).attr('c'));

                    var mineCounterChanged = false;
                    if (evt.which == 3) {
                        var flagRet = ms.flag(r, c)
                        mineCounterChanged = flagRet != 0;
                    } else if (evt.which == 1) {
                        if (r == _this.rPressed && c == _this.cPressed) {
                            mineCounterChanged = ms.open(r, c);
                        }
                    }

                    if (mineCounterChanged) {
                        _this.updateMineCounter();
                    }
                    ms.checkWinning();
                });

                this.cellsView[i][j] = aCell;
                row.append(aCell);
            }
            $('#game-body').append(row);
        }

        // disables right-click context menu
        $('#game-body').on('contextmenu', 'div', function (e) {
            return false;
        });

        this.updateMineCounter();
        this.updateTimer();

        $('body').on('mouseup dragend', function (evt) {
            switch (ms.game) {
            case GameState.SPAWNED:
            case GameState.INTACT:
            case GameState.ALIVE:
                $('#face').attr('emoticon', ':)');
                break;
            case GameState.DEAD:
                $('#face').attr('emoticon', 'X(');
                _this.timer.stop();
                break;
            case GameState.WON:
                $('#face').attr('emoticon', 'B)');
                _this.timer.stop();
                break;
            }

            if (_this.rPressed != -1) {
                _this.updateCell(_this.rPressed, _this.cPressed);
            }

            if (ms.game == GameState.DEAD) {
                _this.revealMines(_this.rPressed, _this.cPressed);
            }

            _this.rPressed = -1;
            _this.cPressed = -1;
        });

        $('#face').mousedown(function (evt) {
            $('#face').attr('emoticon', ':o');
        });
        $('#face').mouseup(function (evt) {
            _this.reset();
            $('#face').attr('emoticon', ':)');
        });
    };

    proto.reset = function () {
        var ms = this.mineSweeper;
        ms.reset();
        for (var i = 1; i <= ms.nRows; i++) {
            for (var j = 1; j <= ms.nColumns; j++) {
                this.cellsView[i][j].attr('val', '_');
            }
        }
        this.timer.reset();
        this.updateMineCounter();
        this.updateTimer(0);
    }

    proto.updateCell = function (r, c) {
        var ms = this.mineSweeper;
        var aCell = this.cellsView[r][c];
        switch (ms.cellStates[r][c]) {
        case State.UNKNOWN:
            aCell.attr('val', '_');
            break;
        case State.OPENED:
            if (ms.minefield[r][c] == 1) {
                aCell.attr('val', '*');
            } else {
                aCell.attr('val', ms.neighbors[r][c].toString());
            }
            break;
        case State.FLAGGED:
            aCell.attr('val', 'F');
            break;
        case State.QUESTIONING:
            aCell.attr('val', '?');
            break;
        case State.WALL:
            console.assert(false, "Update walls?");
            break;
        }
    };

    proto.revealMines = function (rExploded, cExploded) {
        var ms = this.mineSweeper;
        for (var i = 1; i <= ms.nRows; i++) {
            for (var j = 1; j <= ms.nColumns; j++) {
                if (ms.minefield[i][j] == 1 && 
                    ms.cellStates[i][j] != State.FLAGGED) {
                    this.cellsView[i][j].attr('val', '*');
                } else if (ms.minefield[i][j] == 0 && 
                    ms.cellStates[i][j] == State.FLAGGED) {
                    this.cellsView[i][j].attr('val', 'x');
                }
            }
        }
        this.cellsView[rExploded][cExploded].attr('val', '@');
    };

    proto.updateMineCounter = function () {
        var nMinesLeft = this.mineSweeper.nHiddenMines;
        console.assert(0 <= nMinesLeft && nMinesLeft < 1000);
        var s = ('00' + nMinesLeft).slice(-3)
        $('#mine-left-100').attr('val', s[0]);
        $('#mine-left-10').attr('val', s[1]);
        $('#mine-left-1').attr('val', s[2]);
    };

    proto.updateTimer = function (nTicks) {
        if (nTicks === undefined) {
            nTicks = 0;
        } else if (nTicks > 999) {
            nTicks = 999;
        }

        var s = ('00' + nTicks).slice(-3)
        $('#timer-100').attr('val', s[0]);
        $('#timer-10').attr('val', s[1]);
        $('#timer-1').attr('val', s[2]);
    };

    return MineSweeperView;
});
