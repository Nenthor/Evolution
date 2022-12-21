from gpiozero.pins.pigpio import PiGPIOFactory as __Factory
from gpio import Light

__LIGHT_PIN = 13

__enabled = False
__light: Light = None


def start(factory: __Factory):
    global __light, __enabled
    if not __enabled:
        __enabled = True
        __light = Light(factory=factory, pin=__LIGHT_PIN)


def stop():
    global __light, __enabled
    if __enabled:
        __enabled = False
        __light.close()


def changeState(state: str):
    global __light, __enabled
    if not __enabled:
        return
    if state == "0":
        __light.off()
    elif state == "1":
        __light.on()
