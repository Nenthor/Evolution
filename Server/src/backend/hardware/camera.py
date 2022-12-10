from sensors import SENSOR_1 as __SENSOR_1, SENSOR_2 as __SENSOR_2, SENSOR_3 as __SENSOR_3

__FIRST_LEVEL = 300  # [200, 300[
__MIDDLE_LEVEL = 200  # [100, 200[
__LAST_LEVEL = 100  # [0, 100[

__camera = [0, 0, 0]
__distance = [500, 500, 500]


def sendCameraData(index, distance):
    """If camera data has changed it will be sent to the server."""
    global __camera
    if __isDifferentLevel(index, distance):
        sendToServer(f"camera:{__camera[0]}{__camera[1]}{__camera[2]}")


def onSensorData(index, distance):
    global __distance
    __distance[index] = distance
    sendCameraData(index, distance)


def getDistance(index):
    global __distance
    return __distance[index]


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
