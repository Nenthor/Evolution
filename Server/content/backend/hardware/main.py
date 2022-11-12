from time import sleep
import signal
import server
import sensors
import camera
import location
import engine_high as engine
import speed_battery_sensors as sb_sensors

sensor1 = 500
sensor2 = 500
sensor3 = 500

signals = [
    signal.SIGTERM,
    signal.SIGSEGV,
    signal.SIGPIPE,
    signal.SIGINT,
    signal.SIGILL,
    signal.SIGHUP,
    signal.SIGBUS,
]


def signalClose(sig, frame):
    close()


def close():
    server.stop()
    engine.stop()
    sensors.stop()
    location.stop()
    sb_sensors.stop()
    print("Server is closed.")
    exit()


for s in signals:
    signal.signal(s, signalClose)

server.start()
# location.start()   # TODO: Enable this line
# sensors.start()    # TODO: Enable this line
# sb_sensors.start() # TODO: Enable this line

def onMessage(message: str):
    msg = message.split(":")
    if msg[0] == "get_camera":
        camera.forceUpdate()
    elif msg[0] == "get_coords":
        location.forceUpdate("coords")
    elif msg[0] == "get_compass":
        location.forceUpdate("compass")
    elif msg[0] == "get_battery":
        pass  # TODO: Do some coding
    elif msg[0] == "get_speed":
        pass  # TODO: Do some coding
    elif msg[0] == "remotedirection":
        engine.onRemotedirection(msg[1])
    elif msg[0] == "remote_controll":
        engine.onRemoteControll(msg[1] == "on")
    else:
        print(f"{msg[0]} is not available.")


def onSensorData(sensor, distance):
    if sensor == sensors.SENSOR_1:
        global sensor1
        camera.sendCameraData(sensor, distance)
        sensor1 = distance
    elif sensor == sensors.SENSOR_2:
        global sensor2
        camera.sendCameraData(sensor, distance)
        sensor2 = distance
    elif sensor == sensors.SENSOR_3:
        global sensor3
        camera.sendCameraData(sensor, distance)
        sensor3 = distance


server.onMessage = onMessage
sensors.onData = onSensorData
camera.sendToServer = server.send
location.sendToServer = server.send
engine.sendToServer = server.send
sb_sensors.sendToServer = server.send

try:
    while True:
        sleep(3)
except KeyboardInterrupt:
    pass
except Exception as e:
    print(e)

close()
