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
        if engine is not None:
            engine.setSpeed(speed)
            engine.stop()
            engine = None


def sendToServer(message):
    """Send messages to the server if engine is updated."""
    pass


def onRemoteControll(enabled):
    if enabled: start()
    else: stop()


def onRemotedirection(direction):
    global __isActive, engine

    if not __isActive: return

    if direction == 'STANDBY':
        engine.setReverseState(False)
        __setSpeed(0)
    elif direction == 'FORWARD':
        engine.setReverseState(False)
        __setSpeed(100)
        __time.sleep(0.33)
        __setSpeed(50)
    elif direction == 'BACKWARD':
        engine.setReverseState(True)
        __setSpeed(100)
        __time.sleep(0.33)
        __setSpeed(50)
    elif direction == 'LEFT':
        pass
    elif direction == 'RIGHT':
        pass


def __setSpeed(newSpeed):
    global speed, engine
    with __lock:
        speed = newSpeed
    engine.setSpeed(speed)
