import time as __time
import threading as __threading
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
__lock = __threading.Lock()
__timer1 = None
__timer2 = None
__timer3 = None


def __startLoop():
    try:
        while __isActive:
            __sendSignal(__GPIO_TRIGGER_1)
            __time.sleep(0.010)
            __sendSignal(__GPIO_TRIGGER_2)
            __time.sleep(0.010)
            __sendSignal(__GPIO_TRIGGER_3)
            __time.sleep(0.060)
    except Exception:
        stop()


def __sendSignal(channel):
    if channel != None:
        __gpio.output(channel, __gpio.HIGH)
        __time.sleep(0.000010)  # 10 microseconds
        __gpio.output(channel, __gpio.LOW)


def __onEdgeEvent(channel):
    if channel == __GPIO_ECHO_1:
        global __timer1
        if __timer1 == None:
            __timer1 = __time.time()  # Rising event
        else:
            elapsedTime = __time.time() - __timer1
            distance = int((elapsedTime * 34300) / 2)
            __timer1 = None
            if distance <= 450:
                onData(SENSOR_1, distance)
            else:
                onData(SENSOR_1, 500)
    elif channel == __GPIO_ECHO_2:
        global __timer2
        if __timer2 == None:
            __timer2 = __time.time()  # Rising event
        else:
            elapsedTime = __time.time() - __timer2
            distance = int((elapsedTime * 34300) / 2)
            __timer2 = None
            if distance <= 450:
                onData(SENSOR_2, distance)
            else:
                onData(SENSOR_2, 500)
    elif channel == __GPIO_ECHO_3:
        global __timer3
        if __timer3 == None:
            __timer3 = __time.time()  # Rising event
        else:
            elapsedTime = __time.time() - __timer3
            distance = int((elapsedTime * 34300) / 2)
            __timer3 = None
            if distance <= 450:
                onData(SENSOR_3, distance)
            else:
                onData(SENSOR_3, 500)
    else:
        print("channel is not defined.")


def onData(sensor, distance):
    """Overwrite this function to receive distances from sensors."""
    pass


def stop():
    """Deactivate sensors."""
    global __isActive
    with __lock:
        __isActive = False
    __time.sleep(0.1)
    __gpio.setwarnings(False)
    __gpio.cleanup()


def start():
    """Activate sensors."""
    global __isActive
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

    thread = __threading.Thread(target=__startLoop, daemon=True)
    thread.start()
