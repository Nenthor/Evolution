import sys as __sys

__sys.path.append("/home/pi/quick2wire")
del __sys

from i2clibraries import i2c_hmc5883l as __i2c_hmc5883l
from os import error as __error
import time as __time
import threading as __threading
import gps as __gps

__lock = __threading.Lock()
__session = None
__compass = None
__isActive = {"gps": False, "compass": False}
__lat = 0.0
__long = 0.0
__degree = 0


def __checkForLocation():
    global __session, __isActive, __degree
    try:
        while __isActive["gps"]:
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
        while __isActive["compass"]:
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
    global __lock, __session, __isActive, __compass, __error
    with __lock:
        if not __isActive["gps"]:
            try:
                __session = __gps.gps(mode=__gps.WATCH_ENABLE | __gps.WATCH_NEWSTYLE)
                __isActive["gps"] = True
                __threading.Thread(target=__checkForLocation, daemon=True).start()
            except __error:
                print("GPS is not connected.")
        if not __isActive["compass"]:
            try:
                __compass = __i2c_hmc5883l.i2c_hmc5883l(1)
                __compass.setContinuousMode()
                # With https://www.magnetic-declination.com
                __compass.setDeclination(3, 56)
                # Degaussing - possible values: 0.88; 1.3; 1.9; 2.5; 4.0; 4.7; 5.6; 8.1
                __compass.setScale(1.9)
                __isActive["compass"] = True
                __threading.Thread(target=__checkForDegree, daemon=True).start()
            except __error:
                print("Compass is not connected.")


def stop():
    global __lock, __isActive
    with __lock:
        __isActive["gps"] = False
        __isActive["compass"] = False


def __onLocationUpdate(newLat, newLong):
    global __lock, __lat, __long
    if newLat != __lat or newLong != __long:
        with __lock:
            __lat = newLat
            __long = newLong
        if __lat == 0.0 or __long == 0.0:
            sendToServer("coords:Lokalisieren...")
        else:
            sendToServer(f"coords:{__lat} {__long}")
        updatePosition(__lat, __long)


def __onDegreeUpdate(newDegree):
    global __lock, __degree
    if newDegree != __degree:
        with __lock:
            __degree = newDegree
        if __degree >= 0 and __degree < 360:
            sendToServer(f"compass:{__degree}")
            updateDegree(__degree)


def sendToServer(message):
    """Send messages to the server if location is updated."""
    pass


def updateDegree(deg):
    """Update degree for autonomous.py"""
    pass


def updatePosition(lat, long):
    """Update position for autonomous.py"""
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
