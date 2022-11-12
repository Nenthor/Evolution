import sys as __sys

__sys.path.append("/home/pi/quick2wire")
del __sys

from i2clibraries import i2c_hmc5883l as __i2c_hmc5883l
import time as __time
import threading as __threading
import gps as __gps


__lock = __threading.Lock()
__session = None
__compass = None
__isActive = False
__lat = 0.0
__long = 0.0
__degree = 0


def __checkForLocation():
    global __session, __isActive, __degree
    try:
        while __isActive:
            report = __session.next()
            if report["class"] == "TPV":
                lat = float(getattr(report, "lat", "0.0"))
                long = float(getattr(report, "lon", "0.0"))
                __onLocationUpdate(lat, long)
                __time.sleep(0.75)
    except (KeyboardInterrupt, SystemExit):
        print("Stopping search for location")
    except Exception as e:
        print(e)


def __checkForDegree():
    global __degree, __isActive
    try:
        while __isActive:
            degree = __getDegree()
            __onDegreeUpdate(degree)
            __time.sleep(0.75)
    except (KeyboardInterrupt, SystemExit):
        print("Stopping search for new degree")
    except Exception as e:
        print(e)


def __getDegree():
    (degrees, minutes) = __compass.getHeading()
    return round((degrees + (minutes / 60)))


def start():
    global __lock, __session, __isActive, __compass
    with __lock:
        __isActive = True
        __session = __gps.gps(mode=__gps.WATCH_ENABLE | __gps.WATCH_NEWSTYLE)
        __compass = __i2c_hmc5883l.i2c_hmc5883l(1)
        __compass.setContinuousMode()
        # With https://www.magnetic-declination.com
        __compass.setDeclination(3, 56)

    locationThread = __threading.Thread(target=__checkForLocation, daemon=True)
    locationThread.start()
    degreeThread = __threading.Thread(target=__checkForDegree, daemon=True)
    degreeThread.start()


def stop():
    global __lock, __isActive
    with __lock:
        __isActive = False


def __onLocationUpdate(newLat, newLong):
    global __lat, __long
    if newLat != __lat or newLong != __long:
        with __lock:
            __lat = newLat
            __long = newLong
        if __lat == 0.0 or __long == 0.0:
            sendToServer("coords:Lokalisieren...")
        else:
            sendToServer(f"coords:{__lat} {__long}")


def __onDegreeUpdate(newDegree):
    global __degree
    if newDegree != __degree:
        with __lock:
            __degree = newDegree
        if __degree >= 0 and __degree < 360:
            sendToServer(f"compass:{__degree}")


def sendToServer(message):
    """Send messages to the server if location is updated."""
    pass


def forceUpdate(type):
    if type == "coords":
        global __lat, __long
        if __lat == 0.0 or __long == 0.0:
            sendToServer("coords:Lokalisieren...")
        else:
            sendToServer(f"coords:{__lat} {__long}")
    elif type == "compass":
        if __degree >= 0 and __degree < 360:
            sendToServer(f"compass:{__degree}")
