from time import sleep
import server
import sensors
import camera

sensor1 = 500
sensor2 = 500
sensor3 = 500

server.start()
sensors.start()


def onMessage(message):
    print(message)


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

try:
    while True:
        sleep(1)
except KeyboardInterrupt:
    sensors.stop()
except Exception as e:
    sensors.stop()
    print(e)
