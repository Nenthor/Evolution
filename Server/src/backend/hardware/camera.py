from time import time as __time

__FIRST_LEVEL = 300  # [200, 300[
__MIDDLE_LEVEL = 200  # [100, 200[
__LAST_LEVEL = 100  # [0, 100[

__camera = [0, 0, 0]
__lastTime = [__time(), __time(), __time()]


def sendCameraData(index, distance):
    """If camera data has changed it will be sent to the server."""
    global __camera
    if __isDifferentLevel(index, distance):
        sendToServer(f"camera:{__camera[0]}{__camera[1]}{__camera[2]}")


def onSensorData(index: int, distance: int):
    global __lastTime
    time = __time()
    if time - __lastTime[index] > 0.33:  # Timeout (0.33s)
        sendCameraData(index, distance)
        __lastTime[index] = time


def __isDifferentLevel(index, distance):
    global __camera
    level = 0
    if distance < __LAST_LEVEL:
        level = 3
    elif distance < __MIDDLE_LEVEL:
        level = 2
    elif distance < __FIRST_LEVEL:
        level = 1

    if __camera[index] != level:
        __camera[index] = level
        return True
    else:
        return False


def sendToServer(message):
    """Send messages to the server if camera has changed."""
    pass


def forceUpdate():
    global __camera
    sendToServer(f"camera:{__camera[0]}{__camera[1]}{__camera[2]}")
