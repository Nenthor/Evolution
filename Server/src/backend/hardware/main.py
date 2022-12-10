import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Set working directory to to file directory (.../backend/hardware/)
from time import sleep
from datetime import datetime
import signal
import server
import sensors
import music
import camera
import location
import engine_high
import speed_battery_sensors as sb_sensors

signals = [signal.SIGTERM, signal.SIGSEGV, signal.SIGPIPE, signal.SIGINT, signal.SIGILL, signal.SIGHUP, signal.SIGBUS]
engine: engine_high.Engine


def signalClose(sig, frame):
    if sig == signal.SIGINT:
        close(0)
    else:
        with open(f"log/error.log", "w+", encoding="utf-8") as file:
            file.read()
            file.write(f"{datetime.now()}: {signal.Signals(value=sig).name}\n")
        print(f"FATAL ERROR: {signal.Signals(value=sig).name}")
        close(1)


def close(exitCode):
    server.stop()
    engine.stop()
    sensors.stop()
    music.stop()
    location.stop()
    sb_sensors.stop()
    print("Server is closed.")
    exit(code=exitCode)


for s in signals:
    signal.signal(s, signalClose)

server.start()
engine = engine_high.Engine()
# location.start()   # TODO: Enable this line
# sensors.start()    # TODO: Enable this line
# sb_sensors.start() # TODO: Enable this line
# music.start()      # TODO: Enable this line


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
    elif msg[0] == "set_music":
        music.playMusic(msg[1])
    elif msg[0] == "remotedirection":
        engine.onRemotedirection(msg[1])
    elif msg[0] == "remote_controll":
        engine.onRemoteControll(msg[1] == "on")
    else:
        print(f"{msg[0]} is not available.")


server.onMessage = onMessage
sensors.onData = camera.onSensorData
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

close(exitCode=0)
