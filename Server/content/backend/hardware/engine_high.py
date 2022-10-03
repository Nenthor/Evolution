import time as __time
import threading as __threading
import engine_low as __engine

# min_boot_percentage = 73
# min_normal_percantage = 33

__isActive = False
__lock = __threading.Lock()

engine: __engine.Engine = None
speed = 0


def start():
    """Activate engine speed."""
    global __isActive, engine
    with __lock:
        __isActive = True
        engine = __engine.Engine()


def stop():
    """Deactivate engine speed."""
    global __isActive, engine, speed
    with __lock:
        __isActive = False
        speed = 0
        engine.setSpeed(speed)
        engine.stop()
        engine = None


def sendToServer(message):
    """Send messages to the server if engine is updated."""
    pass


def onRemotedirection(direction):
    global engine
    if direction == 'STANDBY':
        __setSpeed(0)
        engine.setReverseState(False)
    elif direction == 'FORWARD':
        __setSpeed(80)
        engine.setReverseState(False)
    elif direction == 'BACKWARD':
        __setSpeed(80)
        engine.setReverseState(True)
    elif direction == 'LEFT':
        pass
    elif direction == 'RIGHT':
        pass


def __setSpeed(newSpeed):
    global speed, engine
    with __lock:
        speed = newSpeed
    engine.setSpeed(speed)
