const fs = require('fs');

const stats = { pixelCount: -1, widthPixelLong: -1.0, widthPixelLat: -1.0, maxTableSet: -1 };
const geodata = [];

var lat = Infinity, long = Infinity; //Unreachable default values
var pixelX = 0, pixelY = 0;
var currentTile = null;
var send, sendAllClients;

const importance = { HIGH: 0, MEDIUM: 1, LOW: 2 }; //For debugging
const outgoing = {  //Outgoing messages to web-clients
    set_navigation: 'set_navigation',
};

module.exports = {
    getNavigation,
    setNavigation,
    setSendFunctions
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
    sendAllClients(`${outgoing.set_navigation}:${data}`, `Ändert "Navigation" zu ${data}.`, null, importance.LOW);
}

function getNavigation(client) {
    var data;
    if (currentTile == null) data = `Lokalisieren...`;
    else data = `filename=${currentTile.filename};pixelX=${pixelX};pixelY=${pixelY}`;
    send(client, `${outgoing.set_navigation}:${data}`, `"Navigation" mit dem Wert "${data}" wird zum Klienten gesendet.`, importance.LOW);
}

function calculateLocation(dmsData) {
    //              Lat           Long
    //Exampel: 48°4'20.336"N 11°40'40.903"O
    if (dmsData == 'Lokalisieren...') {
        lat = -1;
        long = -1;
        return;
    }

    dmsData = dmsData.split(' ');
    lat = dmsToDD(dmsData[0]);
    long = dmsToDD(dmsData[1]);
}

function dmsToDD(dms) {
    //dd = d + m/60 + s/3600
    degrees = parseFloat(dms.split('°')[0]);
    minutes = parseFloat(dms.split('°')[1].split(`'`)[0]);
    seconds = parseFloat(dms.split(`'`)[1].split('"')[0]);
    reverseOrigin = dms[dms.length - 1] == 'S' || dms[dms.length - 1] == 'W' ? -1 : 1;

    return degrees + minutes / 60 + seconds / 3600 * reverseOrigin;
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
