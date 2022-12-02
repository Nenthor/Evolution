from sensors import SENSOR_1 as __SENSOR_1, SENSOR_2 as __SENSOR_2, SENSOR_3 as __SENSOR_3
import time as __time

__FIRST_LEVEL = 300  # [200, 300[
__MIDDLE_LEVEL = 200  # [100, 200[
__LAST_LEVEL = 100  # [0, 100[

__camera = [0, 0, 0]
__last_modified = __time.time()


def sendCameraData(sensor, distance):
    """If camera data has changed it will be sent to the server. Has a cooldown of 0.5s."""
    global __last_modified, __camera
    if __time.time() - __last_modified >= 0.5:
        __last_modified = __time.time()
        if sensor == __SENSOR_1:
            if __isDifferentLevel(0, distance):
                sendToServer(f"camera:{__camera[0]}{__camera[1]}{__camera[2]}")
        elif sensor == __SENSOR_2:
            if __isDifferentLevel(1, distance):
                sendToServer(f"camera:{__camera[0]}{__camera[1]}{__camera[2]}")
        elif sensor == __SENSOR_3:
            if __isDifferentLevel(2, distance):
                sendToServer(f"camera:{__camera[0]}{__camera[1]}{__camera[2]}")


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
