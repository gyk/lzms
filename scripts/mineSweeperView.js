define(['jquery', 'utility', 'mineSweeper', 'timer'], 
  function ($, utility, MineSweeper, Timer) {
    var State = MineSweeper.State;
    var GameState = MineSweeper.GameState;

    function MineSweeperView(mineSweeper) {
        if (mineSweeper === undefined) {
            mineSweeper = new MineSweeper({level: "Intermediate"});
        }

        this.mineSweeper = mineSweeper;
        this.timer = new Timer(this.updateTimer.bind(this), 1000);
        this.eventHandlersRegistered = false;
        this.init();
    }

    var proto = MineSweeperView.prototype;

    proto.init = function () {
        var _this = this;
        var ms = this.mineSweeper;

        // TODO: minimize reflows.
        ms.onOpening = this.updateCell.bind(this);
        ms.onFlagging = this.updateCell.bind(this);
        ms.onFirstOpening = (function () {
            this.timer.start();
        }).bind(this);

        this.cellsView = utility.create2DArray(ms.nRows + 2, ms.nColumns + 2, 
            undefined);
        this.rPressed = -1;
        this.cPressed = -1;
        this.mineRevealed = false;

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
                    switch (ms.game) {
                    case GameState.DEAD:
                    case GameState.WON:
                        return;
                    }

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

        this.updateMineCounter();
        this.updateTimer();

        // jQuery is designed to be capable of binding duplicate event handlers.
        // Just remember whether the registration has been done so we don't 
        // have to write code like this:
        //     $(obj).off('event').on('event', handler);
        if (this.eventHandlersRegistered) return;

        // disables right-click context menu
        $('#game-body').on('contextmenu', 'div', function (e) {
            return false;
        });

        $('body').on('mouseup dragend', function (evt) {
            switch (_this.mineSweeper.game) {
            case GameState.SPAWNED:
            case GameState.INTACT:
            case GameState.ALIVE:
                $('#face').attr('emoticon', ':)');
                break;
            case GameState.DEAD:
                $('#face').attr('emoticon', 'X(');
                _this.timer.stop();
                _this.revealMines(_this.rPressed, _this.cPressed);
                return;
            case GameState.WON:
                $('#face').attr('emoticon', 'B)');
                _this.timer.stop();
                return;
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
            _this.reset();
            $('#face').attr('emoticon', ':)');
        });

        // registers menu event handlers
        $('#menuitem-new').click(function (evt) {
            _this.reset();
        });

        function checkOnly(item) {
            if (item.hasClass('checked')) {
                return false;
            }
            $('#menuitem-beginner').removeClass('checked').addClass('unchecked');
            $('#menuitem-intermediate').removeClass('checked').addClass('unchecked');
            $('#menuitem-expert').removeClass('checked').addClass('unchecked');
            item.removeClass('unchecked').addClass('checked');
            return true;
        }

        $('#menuitem-beginner').click(function (evt) {
            if (!checkOnly($(this))) return;
            delete _this.mineSweeper;
            _this.mineSweeper = new MineSweeper({level: "Beginner"});
            _this.init();
            _this.reset();
        });
        $('#menuitem-intermediate').click(function (evt) {
            if (!checkOnly($(this))) return;
            delete _this.mineSweeper;
            _this.mineSweeper = new MineSweeper({level: "Intermediate"});
            _this.init();
            _this.reset();
        });
        $('#menuitem-expert').click(function (evt) {
            if (!checkOnly($(this))) return;
            delete _this.mineSweeper;
            _this.mineSweeper = new MineSweeper({level: "Expert"});
            _this.init();
            _this.reset();
        });

        $('#menuitem-exit').click(function (evt) {
            _this.close();
        });

        $('#menuitem-about').click(function (evt) {
            // Pop-up windows must be visible and have address bar.
            var aboutWin = window.open('about.html', '_blank', 
                'location=no,status=no,menubar=no,resizable=no');

            aboutWin.onload = function () {
                var leftCol = $('#left-col', aboutWin.document);
                var rightCol = $('#right-col', aboutWin.document);
                aboutWin.innerWidth = $('body', aboutWin.document).width();
                aboutWin.innerHeight = Math.max(leftCol.outerHeight(true), 
                    rightCol.outerHeight(true));
            };
        });

        this.eventHandlersRegistered = true;
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
        this.mineRevealed = false;
    };

    proto.close = function () {
        this.timer.stop();
        this.reset();
        $('#game').css('display', 'none');
        $('#explorer').show();
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

    proto.revealMines = function (rExploded, cExploded) {
        if (this.mineRevealed) return;

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

        if (rExploded != -1 && cExploded != -1) {
            this.cellsView[rExploded][cExploded].attr('val', '@');
        }

        this.mineRevealed = true;
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
