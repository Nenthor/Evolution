import math

distance = 0
ekartDeg = 0
deg = 0
position = (0, 0)
target = (0, 0)


def cancel():
    global distance, deg, ekartDeg, target, position
    distance = 0
    ekartDeg = 0
    deg = 0
    position = (0, 0)
    target = (0, 0)


def updatePosition(lat1, long1):
    global position
    position = (lat1, long1)
    __calculatePath()


def updateDegree(deg):
    global ekartDeg
    ekartDeg = deg
    __calculatePath()


def setTarget(lat1, long1, lat2, long2):
    global distance, deg, target, position
    position = (lat1, long1)
    target = (lat2, long2)
    __calculatePath()


def __calculatePath():
    global distance, deg, ekartDeg, target, position

    distance = __calculateDistance(position, target)
    angle = abs(__calculateAngle(position, target) - ekartDeg)
    if angle > 180:
        angle -= 360
    print(distance, angle)


def __calculateDistance(position, target):
    lat1, long1 = position
    lat2, long2 = target

    # Haversine formula - fancy math
    R = 6366891  # Radius of earth in meters
    dLat = lat2 * math.pi / 180 - lat1 * math.pi / 180
    dLon = long2 * math.pi / 180 - long1 * math.pi / 180
    a = math.sin(dLat / 2) ** 2 + math.cos(lat1 * math.pi / 180) * math.cos(lat2 * math.pi / 180) * math.sin(dLon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    d = R * c
    return round(d, 2)  # meters


def __calculateAngle(position, target):
    lat1, long1 = position
    lat2, long2 = target

    # Bearing formula - fancy math
    dLon = long2 - long1

    y = math.sin(dLon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dLon)

    brng = math.atan2(y, x)

    brng = math.degrees(brng)
    brng = (brng + 360) % 360
    brng = 360 - brng  # count degrees counter-clockwise - remove to make clockwise

    return round(brng)
