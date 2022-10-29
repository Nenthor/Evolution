const fs = require('fs');

const stats = { pixelCount: -1, widthPixelLong: -1.0, widthPixelLat: -1.0, maxTableSet: -1 };
const geodata = [];

var lat = Infinity, long = Infinity; //Unreachable default values
var targetLat = Infinity, targetLong = Infinity;
var pixelX = 0, pixelY = 0;
var targetPixelX = 0, targetPixelY = 0;
var currentTile = null;
var send, sendAllClients;

const importance = { HIGH: 0, MEDIUM: 1, LOW: 2 }; //For debugging
const outgoing = {  //Outgoing messages to web-clients
    set_navigation: 'set_navigation', coords: 'coords', target: 'target'
};

module.exports = {
    getNavigation,
    setNavigation,
    setSendFunctions,
    setTarget,
    getTarget
}

function setSendFunctions(single, all) {
    send = single;
    sendAllClients = all;
}

//Load navigation data
readNavigationFile();
function readNavigationFile() {
    fs.readFile(`${global.path}/content/backend/data/navigation.json`, (error, data) => {
        if (error) { console.log(`Navigationdata could not be loaded: ${error}`); return }
        const jsonData = JSON.parse(data);

        //Set general information
        stats.pixelCount = jsonData[0].pixelCount;
        stats.widthPixelLong = jsonData[0].widthPixelLong;
        stats.widthPixelLat = jsonData[0].widthPixelLat;
        stats.maxTableSet = jsonData[0].maxTableSet;

        //Set geodata
        geodata.push(...jsonData[1].geodata);
        if (lat != Infinity && long != Infinity) getLocationImage();
    });
}

//Set & Get Location
function setNavigation(location) {
    var data;
    calculateLocation(location);
    if (geodata.length != 0) getLocationImage();
    if (currentTile == null) data = `Lokalisieren...`;
    else data = `filename=${currentTile.filename};pixelX=${pixelX};pixelY=${pixelY}`;

    global.navigation = data;
    global.coords = getDMSCoords(lat, long);

    sendAllClients(`${outgoing.set_navigation}:${global.navigation}`, `Navigation mit dem Wert "${global.navigation}" wird an alle Klienten gesendet.`, null, importance.LOW);
    sendAllClients(`${outgoing.coords}:${global.coords}`, `Navigation mit dem Wert "${global.coords}" wird an alle Klienten gesendet.`, null, importance.LOW);
    calculateTarget(targetLat, targetLong);
}

function getNavigation(client) {
    send(client, `${outgoing.set_navigation}:${global.navigation}`, `Navigation mit dem Wert "${global.navigation}" wird zum Klienten gesendet.`, importance.LOW);
    send(client, `${outgoing.coords}:${global.coords}`, `Navigation mit dem Wert "${global.coords}" wird zum Klienten gesendet.`, importance.LOW);
}

function calculateLocation(coords) {
    if (coords == 'Lokalisieren...') {
        lat = Infinity;
        long = Infinity;
        return;
    }

    coords = coords.split(' ');
    lat = parseFloat(coords[0]);
    long = parseFloat(coords[1]);
}

function getDMSCoords(lat, long) {
    if (lat == Infinity || long == Infinity)
        return 'Lokalisieren...';
    else
        return `${decimalToDMS(lat, true)} ${decimalToDMS(long, false)}`
}

function decimalToDMS(decimal, islat) {
    //              Lat           Long
    //Exampel: 48°4'20.336"N 11°40'40.903"O
    const direction = islat ? (decimal > 0 ? 'N' : 'S') : (decimal > 0 ? 'O' : 'W');
    const degree = Math.floor(decimal);
    decimal -= degree;
    const minutes = Math.floor(decimal * 60);
    decimal = (decimal * 60) - minutes
    const seconds = Math.floor((decimal * 60) * 10) / 10;
    decimal = (decimal * 60) - seconds

    //console.log(`${degree}°${minutes}'${seconds}"${direction}`)
    return `${degree}°${minutes}'${seconds}"${direction}`;
}

//Get Location
function getLocationImage() {
    if (currentTile == null || !currentTileContainsLocation())
        currentTile = getNewLocationObj();

    if (currentTile == null) return;

    pixelX = Math.round(Math.abs(long - currentTile.startLong) / Math.abs(stats.widthPixelLong));
    pixelY = Math.round(Math.abs(lat - currentTile.startLat) / Math.abs(stats.widthPixelLat));
}

function currentTileContainsLocation() {
    if (currentTile == null) return false;

    if (!(currentTile.startLong <= long + stats.widthPixelLong && currentTile.endLong >= long - stats.widthPixelLong)) return false;
    if (!(currentTile.endLat <= lat - stats.widthPixelLat && currentTile.startLat >= lat + stats.widthPixelLat)) return false;
    return true;
}

function getNewLocationObj() {
    //                 x  y
    //Example: geodata_18_19
    const index = getLocationIndex();
    if (index == -1) return null;
    else return geodata[index];
}

function getLocationIndex() {
    for (let index in geodata) {
        tile = geodata[index];

        if (!(tile.startLong <= long + stats.widthPixelLong && tile.endLong >= long - stats.widthPixelLong)) continue;
        if (!(tile.endLat <= lat - stats.widthPixelLat && tile.startLat >= lat + stats.widthPixelLat)) continue;
        return index;
    }
    return -1;
}

// Call-Ekart functions
function setTarget(value) {
    if (value == '-1') {
        targetPixelX = 0;
        targetPixelY = 0;
        targetLat = Infinity;
        targetLong = Infinity;
    } else {
        const values = value.split(' ');
        targetLat = parseFloat(values[0]);
        targetLong = parseFloat(values[1]);
    }

    calculateTarget(targetLat, targetLong);
}

function getTarget(client) {
    var message;

    if (targetLat == Infinity || targetLong == Infinity || lat == Infinity || long == Infinity)
        message = '-1';
    else
        message = `${targetPixelX} ${targetPixelY}`

    send(client, `${outgoing.target}:${message}`, `Zielpunkt mit dem Wert "${targetPixelX} ${targetPixelY}" wird zum Klienten gesendet.`, null, importance.LOW);
}

function calculateTarget(targetLat, targetLong) {
    if (lat == Infinity || long == Infinity) return;
    var message = '';

    if (targetLat != Infinity && targetLong != Infinity) {
        diffLat = targetLat - lat;
        diffLong = targetLong - long

        targetPixelX = Math.round(diffLong / Math.abs(stats.widthPixelLong));
        targetPixelY = Math.round(diffLat / Math.abs(stats.widthPixelLat));

        message = `${targetPixelX} ${targetPixelY}`;
    } else message = '-1';

    sendAllClients(`${outgoing.target}:${message}`, `Zielpunkt mit dem Wert "${targetPixelX} ${targetPixelY}" wird an alle Klienten gesendet.`, null, importance.LOW);
}
