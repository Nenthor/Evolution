from time import sleep as __sleep, time as __time
from threading import Thread as __Thread, Lock as __Lock
import gpio as __gpio

SENSOR_1 = 1
__GPIO_TRIGGER_1 = None
__GPIO_ECHO_1 = None

SENSOR_2 = 2
__GPIO_TRIGGER_2 = 23
__GPIO_ECHO_2 = 24

SENSOR_3 = 3
__GPIO_TRIGGER_3 = None
__GPIO_ECHO_3 = None

__isActive = False
__lock = __Lock()
__timer = [None, None, None]
__data: list[tuple[float, int]]


def __startLoop():
    try:
        while __isActive:
            __sendSignal(__GPIO_TRIGGER_1)
            __sleep(0.010)
            __sendSignal(__GPIO_TRIGGER_2)
            __sleep(0.010)
            __sendSignal(__GPIO_TRIGGER_3)
            __sleep(0.060)
    except Exception:
        stop()


def __sendSignal(channel):
    if channel != None:
        __gpio.output(channel, __gpio.HIGH)
        __sleep(0.000010)  # 10 microseconds
        __gpio.output(channel, __gpio.LOW)


def __onEdgeEvent(channel):
    global __timer
    if channel == __GPIO_ECHO_1:
        if __timer[0] == None:
            __timer[0] = __time()  # Rising event
        else:
            elapsedTime = __time() - __timer[0]
            distance = int((elapsedTime * 34300) / 2)
            __timer[0] = None
            if distance <= 450:
                __onNewData(SENSOR_1, distance)
            else:
                __onNewData(SENSOR_1, 500)
    elif channel == __GPIO_ECHO_2:
        if __timer[1] == None:
            __timer[1] = __time()  # Rising event
        else:
            elapsedTime = __time() - __timer[1]
            distance = int((elapsedTime * 34300) / 2)
            __timer[1] = None
            if distance <= 450:
                __onNewData(SENSOR_2, distance)
            else:
                __onNewData(SENSOR_2, 500)
    elif channel == __GPIO_ECHO_3:
        if __timer[2] == None:
            __timer[2] = __time()  # Rising event
        else:
            elapsedTime = __time() - __timer[2]
            distance = int((elapsedTime * 34300) / 2)
            __timer[2] = None
            if distance <= 450:
                __onNewData(SENSOR_3, distance)
            else:
                __onNewData(SENSOR_3, 500)
    else:
        print("channel is not defined.")


def __onNewData(sensor, distance):
    global __data, __lock
    (oldTime, oldDistance) = __data[sensor - 1]
    time = __time()

    if time - oldTime >= 1.0 or distance < oldDistance:
        # Filter: Set data if longer than 1s or distance is smaller
        with __lock:
            __data[sensor - 1] = (time, distance)
        onData(sensor, distance)


def onData(sensor, distance):
    """Overwrite this function to receive distances from sensors."""
    pass


def stop():
    """Deactivate sensors."""
    global __lock, __isActive
    with __lock:
        __isActive = False
    __sleep(0.1)
    __gpio.setwarnings(False)
    __gpio.cleanup()


def start():
    """Activate sensors."""
    global __lock, __isActive, __data
    with __lock:
        __isActive = True
    __gpio.setmode(__gpio.BCM)
    __gpio.setwarnings(False)

    if __GPIO_TRIGGER_1 != None and __GPIO_ECHO_1 != None:
        __gpio.setup(__GPIO_TRIGGER_1, __gpio.OUT, initial=__gpio.LOW)
        __gpio.setup(__GPIO_ECHO_1, __gpio.IN)
        __gpio.add_event_detect(__GPIO_ECHO_1, __gpio.BOTH, callback=__onEdgeEvent)
    if __GPIO_TRIGGER_2 != None and __GPIO_ECHO_2 != None:
        __gpio.setup(__GPIO_TRIGGER_2, __gpio.OUT, initial=__gpio.LOW)
        __gpio.setup(__GPIO_ECHO_2, __gpio.IN)
        __gpio.add_event_detect(__GPIO_ECHO_2, __gpio.BOTH, callback=__onEdgeEvent)
    if __GPIO_TRIGGER_3 != None and __GPIO_ECHO_3 != None:
        __gpio.setup(__GPIO_TRIGGER_3, __gpio.OUT, initial=__gpio.LOW)
        __gpio.setup(__GPIO_ECHO_3, __gpio.IN)
        __gpio.add_event_detect(__GPIO_ECHO_3, __gpio.BOTH, callback=__onEdgeEvent)

    __data = [(__time(), 500), (__time(), 500), (__time(), 500)]

    thread = __Thread(target=__startLoop, daemon=True)
    thread.start()
