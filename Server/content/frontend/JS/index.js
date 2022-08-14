//Server data
const socket = new WebSocket(`ws://${location.host}`);
var coords = 'Lokalisieren...';
var settings = '000';
var speed = '0';
var battery = 0;

socket.addEventListener('open', () => {
    send('get_coords');
    send('get_settings');
    send('get_speed');
    send('get_battery');
    send('get_battery');
    send('get_remotecontrollstate');
}, { passive: true });

socket.addEventListener('message', event => {
    const data = String(event.data).split(':');
    switch (data[0]) {
        case 'coords':
            coords = data[1];
            updateCoords();
            break;
        case 'compass':
            break;
        case 'settings':
            settings = data[1];
            updateSettings();
            break;
        case 'speed':
            speed = data[1];
            updateSpeed();
            break;
        case 'battery':
            battery = parseInt(data[1]);
            updateBattery();
            break;
        case 'remote_controll':
            if (data[1] == 'on') remoteControllEnabled();
            else if (data[1] == 'off') remoteControllDisabled();
            break;
        default:
            break;
    }
}, { passive: true });

function send(message) {
    socket.send(message);
}

//--> INDEX <--

//TripleTap to Debug.html
const logo = document.getElementById('logo');
var tapCount = 0;
logo.addEventListener('click', () => {
    addTapcount();
    if (tapCount >= 3) {
        tapCount = 0;
        open('/debug', '_self');
    }
}, { passive: true });

function addTapcount() {
    tapCount++;
    setTimeout(() => {
        if (tapCount >= 1) tapCount--;
    }, 500); //Delay for 0.5s
}

//Get Date
const footerItems = document.getElementsByClassName("footer_item");
const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const weeks = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function setDate() {
    var date = new Date();
    var minutes = date.getMinutes();
    var hours = date.getHours();
    var day = date.getDate();
    var week = weeks[date.getDay()];
    var month = months[date.getMonth()];
    var year = date.getFullYear();

    if (minutes < 10) minutes = "0" + minutes.toString();
    if (hours < 10) hours = "0" + hours.toString();
    if (day < 10) day = "0" + day.toString();

    //Set Footer Items
    footerItems[1].textContent = `${hours}:${minutes} Uhr`;
    footerItems[2].textContent = `${week}, ${day}. ${month} ${year}`;
}

setDate();
setTimeout(() => {
    setDate();
    setInterval(() => {
        setDate();
    }, 60000);
}, (60 - new Date().getSeconds()) * 1000);

function updateCoords() {
    footerItems[0].textContent = coords;
}

//Settings-Buttons
const settingsItems = document.getElementsByClassName("display_settingsImage");

for (let item = 0; item < settingsItems.length; item++) {
    settingsItems[item].addEventListener("click", () => onClick(item), { passive: true });
}

function replaceAt(text, index, replacement) {
    return text.substring(0, index) + replacement + text.substring(index + 1, replacement.length);
}

updateSettings();
function updateSettings() {
    for (let index = 0; index < settings.length; index++) {
        settingsItems[index].src = getSettingsURL(index, settings[index]);
    }
}

function getSettingsURL(index, state) {
    switch (index) {
        case 0:
            if (state == 1)
                return "/images/sound_on.webp";
            else
                return "/images/sound_off.webp";
        case 1:
            if (state == 1)
                return "/images/light_on.webp";
            else
                return "/images/light_off.webp";
        case 2:
            if (state == 1)
                return "/images/remote_on.webp";
            else
                return "/images/remote_off.webp";
    }
}

//ConfirmBox
const confirmBox = document.getElementById('confirmBox');
const confirmTrue = document.getElementById('confirmTrue');
const confirmFalse = document.getElementById('confirmFalse');
confirmBox.style.display = 'none';

confirmTrue.addEventListener('click', () => {
    send('shutdown');
    confirmBox.style.display = 'none';
}, { passive: true });

confirmFalse.addEventListener('click', () => {
    confirmBox.style.display = 'none';
}, { passive: true });

//onClick
function onClick(index) {
    if (index == 3) {
        confirmBox.style.display = 'flex';
        return;
    }

    var state = parseInt(settings[index]) == 0 ? 1 : 0;
    var url = getSettingsURL(index, state);

    settings = replaceAt(settings, index, state);
    settingsItems[index].src = url;

    send(`set_settings:${settings}`);
}

//Remote controll
const remotecontrollbox = document.getElementById('remotecontrollbox');
const turnOffRemoteControll = document.getElementById('remote_off');
remotecontrollbox.style.display = 'none';

turnOffRemoteControll.addEventListener('click', () => {
    onClick(2);
    remoteControllDisabled();
}, { passive: true });

function remoteControllEnabled() {
    remotecontrollbox.style.display = 'flex';
}

function remoteControllDisabled() {
    remotecontrollbox.style.display = 'none';
}

//--> SPEEDOMETER <--

//Canvas
var canvas = document.getElementById("display_SpeedCanvas");
canvas.width = 500;
canvas.height = 500;

var context = canvas.getContext("2d");

var speedGradient = context.createLinearGradient(0, 500, 0, 0);
speedGradient.addColorStop(0, '#3232CD');
speedGradient.addColorStop(1, '#64b9ff');

var reverseGear = false;

function speedNeedle(rotation) {
    context.lineWidth = 3;

    context.save();
    context.translate(250, 250);
    context.rotate(rotation);
    context.strokeStyle = '#41dcf4';
    context.strokeRect(105, -0.5, 135, 1);
    context.restore();
}

function drawMiniNeedle(rotation, width, speed) {
    context.lineWidth = width;

    context.save();
    context.translate(250, 250);
    context.rotate(rotation);
    context.strokeStyle = "#333";
    context.fillStyle = "#333";
    context.strokeRect(210, -0.5, 20, 1);
    context.restore();

    let x = (250 + 180 * Math.cos(rotation));
    let y = (250 + 180 * Math.sin(rotation));

    context.font = "25px Comfortaa";
    context.fillText(speed, x, y);
}

function calculateSpeedAngle(x, a, b) {
    let degree = (a - b) * (x) + b;
    let radian = (degree * Math.PI) / 180;
    return radian;
}

function drawSpeedo(speed, topSpeed) {
    if (speed == undefined || topSpeed == undefined) return false;

    speed = Math.round(speed);

    //Set Reverse Gear
    if (speed < 0) {
        reverseGear = true;
        speed *= -1;
    } else reverseGear = false;

    //Clear
    context.clearRect(0, 0, canvas.width, canvas.height);

    //Background
    context.beginPath();
    context.fillStyle = '#000';
    context.arc(250, 250, 240, 0, 2 * Math.PI);
    context.fill();

    //Outer-Ring
    context.beginPath();
    context.strokeStyle = "#555";
    context.lineWidth = 1;
    context.arc(250, 250, 240, 0, 2 * Math.PI);
    context.stroke();

    //Middle Number
    context.fillStyle = "#FFF";
    context.font = "bold 100px Comfortaa";
    context.textAlign = "center";
    context.fillText(speed, 250, 290);

    //Reverse Gear
    context.font = "40px Comfortaa";
    if (!reverseGear) {
        context.fillStyle = "#333";
        context.fillText('R', 250, 460);
    } else {
        context.fillStyle = "#CD3232";
        context.fillText('R', 250, 460);
    }

    //Speed Numbers
    context.fillStyle = "#FFF";
    for (var i = 0; i <= topSpeed; i += 2.5) {
        //var rotation = calculateSpeedAngle(i / topSpeed, 83.07888, 34.3775) * Math.PI;
        var rotation = calculateSpeedAngle(i / topSpeed, 127, 45) * Math.PI;
        drawMiniNeedle(rotation, i % 5 == 0 ? 3 : 1, i % 5 == 0 ? i : '');
    }

    //Blur
    context.beginPath();
    context.lineWidth = 25;
    context.shadowBlur = 20;
    context.shadowColor = "#00c6ff";
    context.stroke();

    //Speed Limiter
    if (speed > topSpeed) {
        speed = topSpeed;
    }

    //SpeedBar
    context.beginPath();
    context.strokeStyle = speedGradient;
    context.arc(250, 250, 228, .782 * Math.PI, calculateSpeedAngle(speed / topSpeed, 127, 45) * Math.PI);
    context.stroke();

    //SpeedNeedle
    speedNeedle(calculateSpeedAngle(speed / topSpeed, 127, 45) * Math.PI);
    context.shadowBlur = 0;

    //Inner-Ring
    context.beginPath();
    context.strokeStyle = "#555";
    context.lineWidth = 10;
    context.arc(250, 250, 100, 0, 2 * Math.PI);
    context.stroke();
}

updateSpeed();
function updateSpeed() {
    drawSpeedo(speed, 40);
}

document.fonts.ready.then(() => {
    updateSpeed();
});

// --> BatteryIndicator <--
const bar = document.getElementById("display_battery");
const index = document.getElementById("display_batteryIndex");

updateBattery();
function updateBattery() {
    index.textContent = `${battery}%`
    bar.style.background = `conic-gradient(
        #5694f1 ${battery * 3.6}deg,
        #cadcff ${battery * 3.6}deg
    )`;
}
