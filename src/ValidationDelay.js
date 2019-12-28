export default class ValidationDelay {
    constructor(value) {
        this.value = value;
        this.callBack = null;
        this.param = null;
        this.timer = null;
    }
    run() {
        const timer = setTimeout(this.callBack, this.value, this.param);
        this.timer = timer;
        return this.timer;
    }
    clear() { clearTimeout(this.timer); }
    set cb(cb) {
        console.trace(typeof cb.send === "function");
        if (typeof cb === "function") {
            this.callBack = cb.send;
            this.param = cb.validity;
        }
    }
    get cb() {
        console.trace(this.callBack);
        return this.callBack;
    }
    exec() { this.callBack && this.callBack(); }
}