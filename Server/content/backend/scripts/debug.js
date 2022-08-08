const os = require('os');

var debugListeners = [];
var debugInterval;
var send;
var memoryUsage = 0, cpuusage = 0, systemload = 0;

const importance = { HIGH: 0, MEDIUM: 1, LOW: 2 }; //For debugging
const outgoing = {  //Outgoing messages to web-clients that are on the debug page
    set_memoryusage: 'set_memoryusage', set_cpuusage: 'set_cpuusage', set_systemload: 'set_systemload', add_debugmessage: 'add_debugmessage'
};

module.exports = {
    setSendFunction,
    addDebugListener,
    addDebugMessage,
    removeDebugListener,
    sendDebugData
}

function setSendFunction(func) {
    send = func;
}

function addDebugListener(client) {
    if (debugListeners.length == 0) debugInterval = setDebugInterval();
    debugListeners.push(client);
    sendDebugData(client);
}

function removeDebugListener(client) {
    for (let index = 0; index < debugListeners.length; index++) {
        const listener = debugListeners[index];
        if (listener != client) continue;

        debugListeners.splice(index);
        if (debugListeners.length == 0) clearInterval(debugInterval);
    }
}

function setDebugInterval() {
    return setInterval(() => {
        for (let index = 0; index < debugListeners.length; index++) {
            const listener = debugListeners[index];
            sendDebugData(listener, false);
        }
    }, 5000); //Every 5s
}

function addDebugMessage(message, incoming) {
    if (debugListeners.length == 0) return;

    for (let index = 0; index < debugListeners.length; index++) {
        const listener = debugListeners[index];
        message = message.replace(':', '=');
        if (incoming) {
            listener.send(`${outgoing.add_debugmessage}:IN:${message}`);
        } else {
            listener.send(`${outgoing.add_debugmessage}:OUT:${message}`);
        }
    }
}

function sendDebugData(client, force) {
    sendMemoryUsage(client, force);
    sendCpuUsage(client, force);
    sendSystemLoad(client, force);
}

function sendMemoryUsage(client, force) {
    const percentage = Math.round(os.freemem / os.totalmem * 100);
    if (percentage == memoryUsage && !force) return;
    memoryUsage = percentage;
    send(client, `${outgoing.set_memoryusage}:${percentage}`, `Änderung des "Arbeitsspeichers" auf den Wert "${percentage}".`, importance.LOW);
}

function sendCpuUsage(client, force) {
    const cpus = os.cpus();
    let percentage = 0.0;

    for (let index = 0; index < cpus.length; index++) {
        const core = cpus[index];
        let work = core.times.irq + core.times.nice + core.times.sys + core.times.user;
        let total = work + core.times.idle;
        percentage += work / total;
    }

    percentage = Math.round(percentage / cpus.length * 100);
    if (percentage == cpuusage && !force) return;
    cpuusage = percentage;
    send(client, `${outgoing.set_cpuusage}:${percentage}`, `Änderung der "CPU-Auslastung" auf den Wert "${percentage}".`, importance.LOW);
}

function sendSystemLoad(client, force) {
    const load = Math.round(os.loadavg()[2] / os.cpus().length * 100);
    if (load == systemload && !force) return;
    systemload = load;
    send(client, `${outgoing.set_systemload}:${load}`, `Änderung der "Prozess-Auslastung" auf den Wert "${load}".`, importance.LOW);
}
