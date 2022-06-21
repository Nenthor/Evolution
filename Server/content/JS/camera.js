var obstacles = [];

var emptyColor = "#777";
var occupiedColor = "#cd3232";

//Server data
const socket = new WebSocket(`ws://${location.host}`);
var camera = '000';
var firstLoad = true;

socket.addEventListener('open', () => {
    socket.send('get_camera');
}, {passive: true});

socket.addEventListener('message', event => {
    const data = String(event.data).split(':');
    switch (data[0]) {
        case 'camera':
            camera = data[1];
            if(firstLoad){
                updateCamera();
                firstLoad = false;
            }  
            else location.reload(true);
            break;
        default:
            break;
    }
}, {passive: true});

function getColor(index, level){    
    if(obstacles[index] >= level)
        return occupiedColor;
    else
        return emptyColor;
}

function updateCamera(){
    $("#camera").zinoChart({
        type: "pie",
        variation: "multi-level",
        width: 600,
        height: 600,
        radius: 300,
        legend: false,
        series: [
            {
                "color": "#3268cd",
                "category": [
                    {
                        "value": "16",
                        "color": `${getColor(2, 3)}`,
                        "category": [
                            {
                                "value": "16",
                                "color": `${getColor(2, 2)}`,
                                "category": [
                                    {
                                        "value": "16",
                                        "color": `${getColor(2, 1)}`,
                                    },
                                ]
                            },
                        ]
                    },
                    {
                        "value": "18",
                        "color": `${getColor(1, 3)}`,
                        "category": [
                            {
                                "value": "18",
                                "color": `${getColor(1, 2)}`,
                                "category": [
                                    {
                                        "value": "18",
                                        "color": `${getColor(1, 1)}`,
                                    },
                                ]
                            },
                        ]
                    },
                    {
                        "value": "16",
                        "color": `${getColor(0, 3)}`,
                        "category": [
                            {
                                "value": "16",
                                "color": `${getColor(0, 2)}`,
                                "category": [
                                    {
                                        "value": "16",
                                        "color": `${getColor(0, 1)}`,
                                    },
                                ]
                            },
                        ]
                    },
                    {
                        "value": "50",
                        "color": "#fff0",
                        "category": [
                            {
                                "value": "50",
                                "color": "#fff0",
                                "category": [
                                    {
                                        "value": "50",
                                        "color": "#fff0"
                                    },
                                ]
                            },
                        ]
                    }
                ]
            }
        ]
    });
};