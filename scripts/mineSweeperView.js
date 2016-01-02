define(['jquery', 'utility', 'mineSweeper'], 
  function ($, utility, MineSweeper) {
    var State = MineSweeper.State;
    var GameState = MineSweeper.GameState;

    function MineSweeperView(mineSweeper) {
        if (mineSweeper === undefined) {
            mineSweeper = new MineSweeper({level: "Intermediate"});
        }

        // TODO: it would be better to update cells in batch mode.
        mineSweeper.onOpening = this.updateCell.bind(this);
        mineSweeper.onFlagging = this.updateCell.bind(this);

        this.mineSweeper = mineSweeper;
        this.init();
    }

    var proto = MineSweeperView.prototype;

    proto.init = function () {
        var _this = this;
        var ms = this.mineSweeper;

        this.cellsView = utility.create2DArray(ms.nRows + 2, ms.nColumns + 2, 
            undefined);

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

                    if (evt.which == 3) {
                        ms.flag(r, c);
                    } else if (evt.which == 1) {
                        if (r == _this.rPressed && c == _this.cPressed) {
                            ms.open(r, c);
                        }
                    }
                    ms.checkWinning();
                });

                this.cellsView[i][j] = aCell;
                row.append(aCell);
            }
            $('#game-body').append(row);
        }

        this.rPressed = -1;
        this.cPressed = -1;

        if (ms.game != GameState.SPAWNED && 
            ms.game != GameState.INTACT) {
            ms.reset();  // play again
            return;
        }

        // disables right-click context menu
        $('#game-body').on('contextmenu', 'div', function (e) {
            return false;
        });
        
        $('#game-body').mouseup(function (evt) {
            switch (ms.game) {
            case GameState.SPAWNED:
            case GameState.INTACT:
            case GameState.ALIVE:
                $('#face').attr('emoticon', ':)');
                break;
            case GameState.DEAD:
                $('#face').attr('emoticon', 'X(');
                break;
            case GameState.WON:
                $('#face').attr('emoticon', 'B)');
                break;
            }

            if (_this.rPressed != -1) {
                _this.updateCell(_this.rPressed, _this.cPressed);
            }

            _this.rPressed = -1;
            _this.cPressed = -1;
        });
        $('#face').mousedown(function (evt) {
            $('#face').attr('emoticon', ':o');
        });
        $('#face').mouseup(function (evt) {
            _this.init();
            $('#face').attr('emoticon', ':)');
        });
    };

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

    return MineSweeperView;
});
