class Engine:
    import gpio

    __gpio_AUTONOMOUS_SWITCH = 4  # OUT -> HIGH = on : LOW = off
    __gpio_REVERSE_GEAR = 5      # OUT -> HIGH = on : LOW = off
    __gpio_SPEED_CONTROLL = 21    # OUT -> PWM: 100% = FULL_SPEED : 0% = 0 km/h

    __SPEED_FREQUENCY = 25  # in Hz

    def __init__(self):
        self.speed_control: self.gpio.PWM = None
        self.gpio.setmode(self.gpio.BCM)
        self.gpio.setwarnings(False)

        #self.gpio.setup(self.__gpio_AUTONOMOUS_SWITCH, self.gpio.OUT, initial=self.gpio.LOW)
        self.gpio.setup(self.__gpio_REVERSE_GEAR, self.gpio.OUT, initial=self.gpio.LOW)
        self.speed_controll = self.gpio.PWM(
            self.__gpio_SPEED_CONTROLL, self.__SPEED_FREQUENCY)

    def setAutonomousState(self, enabled: bool):
        if enabled:
            self.gpio.output(self.__gpio_AUTONOMOUS_SWITCH, self.gpio.HIGH)
        else:
            self.gpio.output(self.__gpio_AUTONOMOUS_SWITCH, self.gpio.LOW)

    def setReverseState(self, enabled: bool):
        if enabled:
            self.gpio.output(self.__gpio_REVERSE_GEAR, self.gpio.HIGH)
        else:
            self.gpio.output(self.__gpio_REVERSE_GEAR, self.gpio.LOW)

    def setSpeed(self, percentage):
        if self.speed_controll is None:
            return
        self.speed_controll.changeDutyCycle(percentage)

    def setFrequency(self, frequency: int):
        if self.speed_controll is None:
            return
        self.speed_controll.changeFrequency(frequency)

    def stop(self):
        if self.speed_controll is not None:
            self.speed_controll.stop()
            self.speed_controll = None
        self.gpio.cleanup()
