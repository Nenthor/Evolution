from time import sleep
import server
import sensors
import camera
import location
import engine_high as engine

sensor1 = 500
sensor2 = 500
sensor3 = 500

server.start()
# location.start()  # TODO: Enable this line
# sensors.start()   # TODO: Enable this line
# engine.start()     # TODO: Enable this line


def onMessage(message: str):
    msg = message.split(':')
    if msg[0] == 'get_camera':
        camera.forceUpdate()
    elif msg[0] == 'get_coords':
        location.forceUpdate('coords')
    elif msg[0] == 'get_compass':
        location.forceUpdate('compass')
    elif msg[0] == 'get_battery':
        pass  # TODO: Do some coding
    elif msg[0] == 'get_speed':
        pass  # TODO: Do some coding
    elif msg[0] == 'remotedirection':
        if len(msg) == 2:
            engine.onRemotedirection(msg[1])
    else:
        print(f'{msg[0]} is not available.')


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

try:
    while True:
        sleep(1)
except KeyboardInterrupt:
    sensors.stop()
    location.stop()
except Exception as e:
    sensors.stop()
    print(e)
