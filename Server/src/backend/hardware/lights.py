from gpio import Light

__LIGHT_PIN = 12

__enabled = False
__light: Light = None


def start():
    global __light, __enabled
    if not __enabled:
        __enabled = True
        __light = Light(pin=__LIGHT_PIN)


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
