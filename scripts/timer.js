define(function () {
    var TimerState = {
        STOPPED: 'stopped',
        STARTED: 'started'
    };

    function Timer(handler, interval) {
        // interval: in milliseconds
        this.interval = interval;
        this.internalInterval = Math.floor(interval / 5);
        this.handler = handler;
        this.state = TimerState.STOPPED;
    }

    var proto = Timer.prototype;

    proto.start = function () {
        this.last = Date.now();
        this.timerID = window.setInterval(this.tick.bind(this), 
            this.internalInterval);
        this.nTicks = 0;
        this.state = TimerState.STARTED;
    };

    proto.reset = function () {
        this.stop();
        this.last = undefined;
        this.nTicks = 0;
    };

    proto.stop = function () {
        if (this.state != TimerState.STARTED) return;

        this.timePassed = Date.now() - this.last;
        window.clearInterval(this.timerID);
        this.state = TimerState.STOPPED;
    };

    proto.resume = function () {
        if (this.state != TimerState.STOPPED) return;

        this.last = Date.now() - this.timePassed;
        this.timerID = window.setInterval(this.tick.bind(this), 
            this.internalInterval);
        this.state = TimerState.STARTED;
    };

    proto.tick = function () {
        var now = Date.now();
        if (now - this.last >= this.interval) {
            this.handler(++this.nTicks);
            this.last += this.interval;
        }
    };

    return Timer;
});
