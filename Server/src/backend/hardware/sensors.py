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
    except Exception as e:
        print(e)
        stop()


def __sendSignal(channel):
    if channel != None:
        __gpio.output(channel, __gpio.HIGH)
        __sleep(0.000010)  # 10 microseconds
        __gpio.output(channel, __gpio.LOW)


def __onEdgeEvent(channel):
    global __timer, __lock
    index = __getEchoIndex(channel)
    if index != -1:
        if __timer[index] == None:
            # Rising event - Echo signal start
            with __lock:
                __timer[index] = __time()
        else:
            # Falling event - Echo signal end
            elapsedTime = __time() - __timer[index]
            distance = int((elapsedTime * 34300) / 2)
            with __lock:
                __timer[index] = None
            if distance <= 450:
                __onNewData(index, distance)
            else:
                __onNewData(index, 500)


def __onNewData(index, distance):
    global __data, __lock
    (oldTime, oldDistance) = __data[index]
    time = __time()

    if time - oldTime >= 0.5 or distance < oldDistance:
        # Timeout: Set data if longer than 0.5s or distance is smaller
        with __lock:
            __data[index] = (time, distance)
        onData(index, distance)


def __getEchoIndex(echo):
    if echo == __GPIO_ECHO_1:
        return 0
    elif echo == __GPIO_ECHO_2:
        return 1
    elif echo == __GPIO_ECHO_3:
        return 2
    else:
        print("channel is not defined.")
        return -1


def __setupSensor(triggerPin, echoPin):
    __gpio.setup(triggerPin, __gpio.OUT, initial=__gpio.LOW)
    __gpio.setup(echoPin, __gpio.IN)
    __gpio.add_event_detect(echoPin, __gpio.BOTH, callback=__onEdgeEvent)


def onData(index, distance):
    """Overwrite this function to receive distances from sensors."""
    pass


def stop():
    """Deactivate sensors."""
    global __isActive
    if __isActive:
        __isActive = False
        __sleep(0.1)
        __gpio.setwarnings(False)
        __gpio.cleanup()


def start():
    """Activate sensors."""
    global __lock, __isActive, __data
    if __isActive:
        return
    __isActive = True
    __gpio.setmode(__gpio.BCM)
    __gpio.setwarnings(False)

    if __GPIO_TRIGGER_1 != None and __GPIO_ECHO_1 != None:
        __setupSensor(__GPIO_TRIGGER_1, __GPIO_ECHO_1)
    if __GPIO_TRIGGER_2 != None and __GPIO_ECHO_2 != None:
        __setupSensor(__GPIO_TRIGGER_2, __GPIO_ECHO_2)
    if __GPIO_TRIGGER_3 != None and __GPIO_ECHO_3 != None:
        __setupSensor(__GPIO_TRIGGER_3, __GPIO_ECHO_3)

    __data = [(__time(), 500), (__time(), 500), (__time(), 500)]

    thread = __Thread(target=__startLoop, daemon=True)
    thread.start()
