const fs = require('fs');

var batteryFunction, cameraFunction, coordsFunction, speedFunction;

module.exports = {
    setup: setupNodeConnection
}

function setupNodeConnection(nodeBatteryFunction, nodeCameraFunction, nodeCoordsFunction, nodeSpeedFunction){
    batteryFunction = nodeBatteryFunction;
    cameraFunction = nodeCameraFunction;
    coordsFunction = nodeCoordsFunction;
    speedFunction = nodeSpeedFunction;
}

updateData();
function updateData() {
    updateBattery(5000); //Update every 5s
    updateCamera(500); //Update every 0,5s
    updateCoords(1000); //Update every 1s
    updateSpeed(300); //Update every 0,3s
}

function updateBattery(interval) {
    setInterval(() => {
        fs.readFile(`${global.path}/content/data/battery.txt`, 'utf8', (error, data) => {
            if (error) {
                console.warn(`Error while getting battery file`);
            } else if (global.data.battery != data) {
                batteryFunction(data);
            }
        });
    }, interval);
}

function updateCamera(interval) {
    setInterval(() => {
        fs.readFile(`${global.path}/content/data/camera.txt`, 'utf8', (error, data) => {
            if (error) {
                console.warn(`Error while getting camera file`);
            } else if (global.data.camera != data) {
                cameraFunction(data);
            }
        });
    }, interval);
}

function updateCoords(interval) {
    setInterval(() => {
        fs.readFile(`${global.path}/content/data/coords.txt`, 'utf8', (error, data) => {
            if (error) {
                console.warn(`Error while getting coords file`);
            } else if (global.data.coords != data) {
                coordsFunction(data);
            }
        });
    }, interval);
}

function updateSpeed(interval) {
    setInterval(() => {
        fs.readFile(`${global.path}/content/data/speed.txt`, 'utf8', (error, data) => {
            if (error) {
                console.warn(`Error while getting speed file`);
            } else if (global.data.speed != data) {
                speedFunction(data);
            }
        });
    }, interval);
}