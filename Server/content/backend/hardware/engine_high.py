import time as __time
import threading as __threading
from engine_low import Engine as __Engine

# min_boot_percentage = 73
# min_normal_percantage = 33

__isActive = False
__lock = __threading.Lock()

engine: __Engine
speed = 0


def start():
    """Activate engine speed."""
    global __isActive, engine
    if __isActive:
        return
    with __lock:
        __isActive = True
        engine = __Engine()


def stop():
    """Deactivate engine speed."""
    global __isActive, engine, speed
    if not __isActive:
        return
    with __lock:
        __isActive = False
        speed = 0
        engine.setSpeed(speed)
        engine.stop()


def sendToServer(message):
    """Send messages to the server if engine is updated."""
    pass


def onRemoteControll(enabled):
    if enabled:
        start()
    else:
        stop()


def onRemotedirection(direction):
    global __isActive, engine

    if not __isActive:
        return

    if direction == "STANDBY":
        engine.setReverseState(False)
        __setSpeed(0)
    elif direction == "FORWARD":
        engine.setReverseState(False)
        __setSpeed(100)
        __time.sleep(0.5)
        __setSpeed(60)
    elif direction == "BACKWARD":
        engine.setReverseState(True)
        __time.sleep(0.1)
        __setSpeed(100)
        __time.sleep(0.5)
        __setSpeed(60)
    elif direction == "LEFT":
        pass
    elif direction == "RIGHT":
        pass


def __setSpeed(newSpeed):
    global speed, engine
    if not __isActive:
        return
    with __lock:
        speed = newSpeed
    engine.setSpeed(speed)
