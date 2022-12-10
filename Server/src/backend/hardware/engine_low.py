class Engine:
    from threading import Thread, Lock
    from time import sleep, time
    import gpio

    __GPIO_AUTONOMOUS_SWITCH = 4  # OUT -> HIGH = on : LOW = off
    __GPIO_REVERSE_GEAR = 20  # OUT -> HIGH = on : LOW = off
    __GPIO_SPEED_CONTROLL = 21  # OUT -> PWM: 100% = FULL_SPEED : 0% = 0 km/h

    __SPEED_FREQUENCY = 30  # in Hz
    __THREAD_DELAY = 0.5  # 500ms

    def __init__(self):
        self.speed_control: self.gpio.PWM
        self.reverse_state = False
        self.lock = self.Lock()
        self.threadStarttime = self.time()
        self.gpio.setmode(self.gpio.BCM)
        self.gpio.setwarnings(False)

        # self.gpio.setup(self.__gpio_AUTONOMOUS_SWITCH, self.gpio.OUT, initial=self.gpio.LOW)
        self.gpio.setup(self.__GPIO_REVERSE_GEAR, self.gpio.OUT, initial=self.gpio.LOW)
        self.speed_controll = self.gpio.PWM(self.__GPIO_SPEED_CONTROLL, self.__SPEED_FREQUENCY)
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
            self.gpio.output(self.__GPIO_AUTONOMOUS_SWITCH, self.gpio.HIGH)
        else:
            self.gpio.output(self.__GPIO_AUTONOMOUS_SWITCH, self.gpio.LOW)

    def __cleanup(self):
        self.gpio.cleanup(self.__GPIO_AUTONOMOUS_SWITCH)
        self.gpio.cleanup(self.__GPIO_REVERSE_GEAR)
        self.speed_control.stop()

    def __setReverseState(self, enabled: bool):
        if not self.enabled or self.reverse_state == enabled:
            return
        with self.lock:
            if enabled:
                self.gpio.output(self.__GPIO_REVERSE_GEAR, self.gpio.HIGH)
            else:
                self.gpio.output(self.__GPIO_REVERSE_GEAR, self.gpio.LOW)
            self.reverse_state = enabled
        self.sleep(0.05)  # 50ms

    def __setSpeed(self, percentage):
        if self.enabled:
            self.speed_controll.changeDutyCycle(percentage)

    def setFrequency(self, frequency: int):
        if self.enabled:
            self.speed_controll.changeFrequency(frequency)

    def setDirection(self, speed=0, reverseState=False):
        with self.lock:
            time = self.time()
            self.threadStarttime = time
            if speed == 0:
                self.__setSpeed(0)
                self.__setReverseState(reverseState)
            elif time - self.threadStarttime >= 0.5:
                # Timeout-check (500ms)
                self.Thread(target=self.__startDirection, args=(time, speed, reverseState), daemon=True).start()

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
