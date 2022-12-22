import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Set working directory to to file directory (.../backend/hardware/)
from time import sleep
from datetime import datetime
from subprocess import check_call as sys_call
from gpiozero.pins.pigpio import PiGPIOFactory
import signal
import server
import sensor
import music
import lights
import camera
import location
from engine import Engine

FACTORY = PiGPIOFactory()

signals = [signal.SIGTERM, signal.SIGSEGV, signal.SIGPIPE, signal.SIGINT, signal.SIGILL, signal.SIGHUP, signal.SIGBUS]
distanceSensor: sensor.DistanceSensor
sbSensor: sensor.SpeedBatterySensor
engine: Engine


def signalClose(sig, frame):
    if sig == signal.SIGINT:
        close(0)
    else:
        with open(f"log/error.log", "w+", encoding="utf-8") as file:
            file.read()
            file.write(f"{datetime.now()}: {signal.Signals(value=sig).name}\n")
        print(f"FATAL ERROR: {signal.Signals(value=sig).name}")
        close(1)


def cleanup():
    server.stop()
    engine.stop()
    distanceSensor.stop()
    music.stop()
    lights.stop()
    location.stop()
    sbSensor.stop()
    sleep(0.05)


def close(exitCode):
    cleanup()
    print("Server is closed.")
    exit(code=exitCode)


for s in signals:
    signal.signal(s, signalClose)

engine = Engine(FACTORY)
distanceSensor = sensor.DistanceSensor(FACTORY)
sbSensor = sensor.SpeedBatterySensor()

server.start()
engine.start()
# location.start()          # TODO: Enable this line
# distanceSensor.start()    # TODO: Enable this line
# sbSensor.start()          # TODO: Enable this line
# music.start()             # TODO: Enable this line
# lights.start(FACTORY)     # TODO: Enable this line


def onMessage(message: str):
    msg = message.split(":")
    if msg[0] == "get_camera":
        camera.forceUpdate()
    elif msg[0] == "get_coords":
        location.forceUpdate("coords")
    elif msg[0] == "get_compass":
        location.forceUpdate("compass")
    elif msg[0] == "get_battery":
        sbSensor.forceUpdate("battery")
    elif msg[0] == "get_speed":
        sbSensor.forceUpdate("speed")
    elif msg[0] == "set_music":
        music.playMusic(msg[1])
    elif msg[0] == "set_lights":
        lights.changeState(msg[1])
    elif msg[0] == "remotedirection":
        engine.onRemotedirection(msg[1])
    elif msg[0] == "remote_controll":
        engine.onRemoteControll(msg[1] == "on")
    elif msg[0] == "shutdown":
        cleanup()
        sys_call(["sudo", "shutdown", "now"])
    elif msg[0] == "disconnected":
        onClientDisconnect()
    else:
        print(f"{msg[0]} is not available.")


def onClientDisconnect():
    music.playMusic("0")
    lights.changeState("0")
    engine.onRemotedirection("STANDBY")
    engine.onRemoteControll(False)


server.onMessage = onMessage
distanceSensor.updateCamera = camera.onSensorData
camera.sendToServer = server.send
location.sendToServer = server.send
engine.sendToServer = server.send
sbSensor.sendToServer = server.send

try:
    while True:
        sleep(3)
except KeyboardInterrupt:
    pass
except Exception as e:
    print(e)

close(exitCode=0)
