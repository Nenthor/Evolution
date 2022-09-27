import RPi.GPIO as __GPIO

UNKNOWN = -1
OUT = 0
IN = 1
LOW = 0
HIGH = 1
BOARD = 10
BCM = 11
PUD_DOWN = 21
PUD_UP = 22
RISING = 31
FALLING = 32
BOTH = 33
SPI = 41
I2C = 42
HARD_PWM = 43
SERIAL = 40
RPI_INFO = __GPIO.RPI_INFO
VERSION = __GPIO.VERSION


def setmode(mode):
    if mode == BOARD or mode == BCM:
        __GPIO.setmode(mode)
    else:
        print('Unknown __GPIO mode.')


def getmode():
    return __GPIO.getmode()


def setwarnings(isActive: bool):
    __GPIO.setwarnings(isActive)


def setup(channel: int, mode, initial=None, pull_up_down=None):
    if mode != IN and mode != OUT:
        print('Unknown channel setup mode.')
        return
    if initial != None and initial != LOW and initial != HIGH:
        print('Unknown channel setup initial state.')
        return
    if pull_up_down != None and pull_up_down != PUD_DOWN and pull_up_down != PUD_UP:
        print('Unknown channel setup pull_up_down configuration.')
        return

    if mode == IN:
        if pull_up_down == None:
            __GPIO.setup(channel, mode)
        else:
            __GPIO.setup(channel, mode, pull_up_down=pull_up_down)
    else:
        if initial == None:
            __GPIO.setup(channel, mode)
        else:
            __GPIO.setup(channel, mode, initial=initial)


def input(channel: int):
    return __GPIO.input(channel)


def output(channel: int, state):
    if state == LOW or state == HIGH:
        __GPIO.output(channel, state)
    else:
        print('Unknown channel output configuration.')


def cleanup(channel=None):
    if (channel == None):
        __GPIO.cleanup()
    else:
        __GPIO.cleanup(channel)


def wait_for_edge(channel: int, event, timeout=None):
    """Timeout in milliseconds"""
    if event != FALLING and event != RISING and event != BOTH:
        print('Unknown edge event.')
        return None
    if timeout == None:
        return __GPIO.wait_for_edge(channel, event)
    else:
        return __GPIO.wait_for_edge(channel, event, timeout=timeout)


def add_event_detect(channel: int, event, callback=None, bouncetime=None):
    """Bouncetime in milliseconds"""
    if event != FALLING and event != RISING and event != BOTH:
        print('Unknown event.')
        return
    if callback == None:
        if bouncetime == None:
            __GPIO.add_event_detect(channel, event)
        else:
            __GPIO.add_event_detect(channel, event, bouncetime=bouncetime)
    else:
        if bouncetime == None:
            __GPIO.add_event_detect(channel, event, callback=callback)
        else:
            __GPIO.add_event_detect(
                channel, event, callback=callback, bouncetime=bouncetime)


def add_event_callback(channel: int, callback: function):
    __GPIO.add_event_callback(channel, callback)


def event_detected(channel: int):
    return __GPIO.event_detected(channel)


def remove_event_detect(channel: int):
    __GPIO.remove_event_detect(channel)


def GPIO_function(pin: int):
    return __GPIO.__GPIO_function(pin)


class PWM:
    def __init__(self, channel: int, frequency: int):
        setup(channel, OUT)
        self.channel = channel
        self.PWM = __GPIO.PWM(channel, frequency)

    def start(self, dc: float):
        self.PWM.start(dc)

    def changeFrequency(self, freq: int):
        self.PWM.ChangeFrequency(freq)

    def changeDutyCycle(self, dc: float):
        if 0 <= dc and dc <= 100:
            self.PWM.ChangeDutyCycle(dc)
        else:
            self.PWM.ChangeDutyCycle(0)
            print('{dc} is not a valid input for duty cycle.')

    def stop(self):
        self.PWM.stop()
        cleanup(self.channel)
