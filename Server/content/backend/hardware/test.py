import time
import sensors

def onData(sensor, distance):
    if sensor == sensors.SENSOR_1:
        print(f'{distance}cm')
sensors.onData = onData

try:
    sensors.start()
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    sensors.stop()