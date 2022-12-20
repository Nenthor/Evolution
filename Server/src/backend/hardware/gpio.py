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

    def __init__(self, factory):
        self.enabled = False
        self.reverse_state = False
        self.lock = self.__Lock()
        self.oldTime = self.__time()
        self.FACTORY = factory

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
        if time - self.oldTime > self.__START_HELP or speed == 0:
            with self.lock:
                self.oldTime = time
                if speed == 0:
                    self.__setSpeed(speed)
                    self.__setReverseState(reverse_state)
                else:
                    self.__Thread(target=self.__startDirection, args=(time, speed, reverse_state), daemon=True).start()

    def __startDirection(self, time, speed, reverseState):
        with self.lock:
            self.__setReverseState(reverseState)
            if time != self.oldTime or not self.enabled or speed == 0:
                return
            self.__setSpeed(1)
        self.__sleep(self.__START_HELP)
        with self.lock:
            if time != self.oldTime or not self.enabled:
                return
            self.__setSpeed(speed)

    def __setReverseState(self, reverse_state):
        if self.reverse_state != reverse_state:
            self.reverse_state = not self.reverse_state
            self.reverse.toggle()
            self.__sleep(0.05) # 50ms

    def __setSpeed(self, value):
        self.speed_control.value = value


class DistanceSensor:
    from gpiozero.pins.pigpio import PiGPIOFactory
    from gpiozero import DistanceSensor as Sensor

    def __init__(self, factory:PiGPIOFactory, trigger: int, echo: int):
        self.enabled = trigger != None and echo != None
        if self.enabled:
            self.FACTORY = factory
            self.sensor = self.Sensor(trigger=trigger, echo=echo, queue_len=1, max_distance=5, pin_factory=self.FACTORY)

    def close(self):
        if self.enabled:
            self.sensor.close()
            self.enabled = False

    def isEnabled(self) -> bool:
        return self.enabled

    def getDistance(self) -> int:
        """Returns distance in cm (0cm - 500cm)"""
        if self.enabled:
            return round(self.sensor.distance * 100)
        else:
            return -1
