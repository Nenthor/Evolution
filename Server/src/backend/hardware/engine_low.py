"""
class Engine:
    from threading import Thread, Lock
    from time import sleep, time
    import RPi_gpio as RPi_gpio

    __GPIO_AUTONOMOUS_SWITCH = 4  # OUT -> HIGH = on : LOW = off
    __GPIO_REVERSE_GEAR = 20  # OUT -> HIGH = on : LOW = off
    __GPIO_SPEED_CONTROL = 21  # OUT -> PWM: 100% = FULL_SPEED : 0% = 0 km/h

    __SPEED_FREQUENCY = 30  # in Hz
    __THREAD_DELAY = 0.5  # 500ms

    def __init__(self):
        self.speed_control: self.RPi_gpio.PWM
        self.reverse_state = False
        self.lock = self.Lock()
        self.threadStarttime = self.time()
        self.RPi_gpio.setmode(self.RPi_gpio.BCM)
        self.RPi_gpio.setwarnings(True)

        # self.gpio.setup(self.__gpio_AUTONOMOUS_SWITCH, self.gpio.OUT, initial=self.gpio.LOW) # TODO: Enable cleanup
        self.RPi_gpio.setup(self.__GPIO_REVERSE_GEAR, self.RPi_gpio.OUT, initial=self.RPi_gpio.LOW)
        self.speed_control = self.RPi_gpio.PWM(self.__GPIO_SPEED_CONTROL, self.__SPEED_FREQUENCY)
        self.enabled = True

    def stop(self):
        if self.enabled:
            self.__setSpeed(0)
            self.__cleanup()
            self.threadStarttime = self.time()
            self.enabled = False

    def setAutonomousState(self, enabled: bool):
        if not self.enabled:
            return
        if enabled:
            self.RPi_gpio.output(self.__GPIO_AUTONOMOUS_SWITCH, self.RPi_gpio.HIGH)
        else:
            self.RPi_gpio.output(self.__GPIO_AUTONOMOUS_SWITCH, self.RPi_gpio.LOW)

    def __cleanup(self):
        # self.gpio.cleanup(self.__GPIO_AUTONOMOUS_SWITCH)
        self.RPi_gpio.cleanup(self.__GPIO_REVERSE_GEAR)
        self.speed_control.stop()

    def __setReverseState(self, enabled: bool):
        if not self.enabled or self.reverse_state == enabled:
            return

        if enabled:
            self.RPi_gpio.output(self.__GPIO_REVERSE_GEAR, self.RPi_gpio.HIGH)
        else:
            self.RPi_gpio.output(self.__GPIO_REVERSE_GEAR, self.RPi_gpio.LOW)
        self.reverse_state = enabled

        self.sleep(0.05)  # 50ms

    def __setSpeed(self, percentage):
        if self.enabled:
            self.speed_control.changeDutyCycle(percentage)

    def __setFrequency(self, frequency: int):
        if self.enabled:
            self.speed_control.changeFrequency(frequency)

    def setDirection(self, speed=0, reverse_state=False):
        with self.lock:
            time = self.time()
            if speed == 0:
                self.__setSpeed(0)
                self.__setReverseState(reverse_state)
            elif time - self.threadStarttime >= 0.5:
                # Timeout-check (500ms)
                self.threadStarttime = time
                self.Thread(target=self.__startDirection, args=(time, speed * 100, reverse_state), daemon=True).start()

    def __startDirection(self, time, speed, reverseState):
        self.__setReverseState(reverseState)
        if time != self.threadStarttime or not self.enabled or speed == 0:
            return
        with self.lock:
            self.__setSpeed(100)
        self.sleep(self.__THREAD_DELAY)
        if time != self.threadStarttime or not self.enabled:
            return
        with self.lock:
            self.__setSpeed(speed)
"""


class Engine:
    from threading import Thread as __Thread, Lock as __Lock
    from time import sleep as __sleep, time as __time
    from gpiozero import PWMOutputDevice, OutputDevice
    from gpiozero.pins.pigpio import PiGPIOFactory

    # from gpiozero.pins.rpigpio import RPiGPIOFactory

    __GPIO_AUTONOMOUS_SWITCH = 4  # OUT -> HIGH = on : LOW = off
    __GPIO_REVERSE_GEAR = 20  # OUT -> HIGH = on : LOW = off
    __GPIO_SPEED_CONTROL = 21  # OUT -> PWM: 100% = FULL_SPEED : 0% = 0 km/h
    __SPEED_FREQUENCY = 30  # in Hz
    __START_HELP = 0.5  # 500ms (time where engine is at 100%)

    autonomous: OutputDevice
    speed_control: PWMOutputDevice
    reverse: OutputDevice

    def __init__(self):
        self.enabled = False
        self.reverse_state = False
        self.lock = self.__Lock()
        self.oldTime = self.__time()
        self.FACTORY = self.PiGPIOFactory()

    def start(self):
        if not self.enabled:
            # self.autonomous = self.OutputDevice(pin=self.__GPIO_AUTONOMOUS_SWITCH, initial_value=False, pin_factory=self.FACTORY) TODO: Enable
            self.speed_control = self.PWMOutputDevice(pin=self.__GPIO_SPEED_CONTROL, frequency=self.__SPEED_FREQUENCY, pin_factory=self.FACTORY)
            self.reverse = self.OutputDevice(pin=self.__GPIO_REVERSE_GEAR, initial_value=False, pin_factory=self.FACTORY)
            self.oldTime = self.__time()
            self.enabled = True

    def stop(self):
        if self.enabled:
            self.speed_control.close()
            self.reverse.close()
            # self.autonomous.close() TODO: Enable
            self.enabled = False

    def setAutonomousState(self, enabled: bool):
        if not self.enabled:
            return
        if enabled:
            self.autonomous.on()
        else:
            self.autonomous.off()

    def setDirection(self, speed=0, reverse_state=False):
        if not self.enabled:
            return
        time = self.__time()
        if time - self.oldTime > self.__START_HELP:
            with self.lock:
                self.oldTime = time
                if speed == 0:
                    self.__setReverseState(reverse_state)
                    self.__setSpeed(speed)
                else:
                    self.__Thread(target=self.__startDirection, args=(time, speed * 100, reverse_state), daemon=True).start()

    def __startDirection(self, time, speed, reverseState):
        self.__setReverseState(reverseState)
        if time != self.oldTime or not self.enabled or speed == 0:
            return
        with self.lock:
            self.__setSpeed(1)
        self.__sleep(self.__START_HELP)
        if time != self.oldTime or not self.enabled:
            return
        with self.lock:
            self.__setSpeed(speed)

    def __setReverseState(self, reverse_state):
        if self.reverse_state != reverse_state:
            self.reverse_state = not self.reverse_state
            self.reverse.toggle()
            self.__sleep(0.05)  # 50ms

    def __setSpeed(self, value):
        self.speed_control.value = value
