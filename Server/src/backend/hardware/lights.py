from gpio import Lights

__enabled = False
__light: Lights = None


def start():
    global __light, __enabled
    if not __enabled:
        __enabled = True
        __light = Lights()


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
