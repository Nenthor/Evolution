import gps as __gps
import threading as __threading

__lock = __threading.Lock()
__session = None
__isActive = False
__lat = 0.0
__long = 0.0


def __checkForLocation():
    global __session, __isActive
    try:
        while __isActive:
            report = __session.next()
            if report['class'] == 'TPV':
                lat = float(getattr(report, 'lat', '0.0'))
                long = float(getattr(report, 'lon', '0.0'))
                onData(lat, long)
    except (KeyboardInterrupt, SystemExit):
        print('nice')
    except Exception as e:
        print(e)


def start():
    global __lock, __session, __isActive
    with __lock:
        __isActive = True
        __session = __gps.gps(mode=__gps.WATCH_ENABLE | __gps.WATCH_NEWSTYLE)

    thread = __threading.Thread(target=__checkForLocation, daemon=True)
    thread.start()


def stop():
    global __lock, __isActive
    with __lock:
        __isActive = False


def onData(newLat, newLong):
    global __lat, __long
    if newLat != __lat or newLong != __long:
        with __lock:
            __lat = newLat
            __long = newLong
        if __lat == 0.0 or __long == 0.0:
            sendToServer('coords:Lokalisieren...')
        else:
            sendToServer(f'coords:{__lat} {__long}')


def sendToServer(message):
    """Send messages to the server if location is updated."""
    pass


def forceUpdate():
    global __lat, __long
    if __lat == 0.0 or __long == 0.0:
        sendToServer('coords:Lokalisieren...')
    else:
        sendToServer(f'coords:{__lat} {__long}')
