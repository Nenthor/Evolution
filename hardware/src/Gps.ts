import GPS from "gps";
import { SerialPort } from "serialport";
import { send } from "./Communication.js";
 
let gps: GPS
let serial: SerialPort
let lat = 0, long = 0

export default () => {
  if(gps || serial) return;

  serial = new SerialPort({ path: '/dev/serial0', baudRate: 9600 })
  serial.on('data', data => gps.updatePartial(data))

  gps = new GPS()
  gps.on('data', (data) => {
    if (!data.valid || !gps.state.lat || !gps.state.lon) return;
    if (lat == gps.state.lat && long == gps.state.lon) return;
    lat = gps.state.lat;
    long = gps.state.lon;
    
    send(`gps=${JSON.stringify({lat, long})}`)
  })
}


