import gpio as __gpio

__GPIO_AUTONOMOUS_SWITCH = 4  # OUT -> HIGH = on : LOW = off
__GPIO_REVERSE_GEAR = 17      # OUT -> HIGH = on : LOW = off
__GPIO_SPEED_CONTROLL = 25    # OUT -> PWM: 100% = FULL_SPEED : 0% = 0 km/h

__SPEED_FREQUENCY = 100  # in Hz


class Engine:
    def __innit__(self):
        __gpio.setmode(__gpio.BCM)
        __gpio.setwarnings(False)

        __gpio.setup(__GPIO_AUTONOMOUS_SWITCH, __gpio.OUT, initial=__gpio.LOW)
        __gpio.setup(__GPIO_REVERSE_GEAR, __gpio.OUT, initial=__gpio.HIGH)
        self.speed_controll = __gpio.PWM(
            __GPIO_SPEED_CONTROLL, __SPEED_FREQUENCY)
        self.speed_controll.changeDutyCycle(0)

        return self

    def setAutonomousState(self, enabled: bool):
        if enabled:
            __gpio.output(__GPIO_AUTONOMOUS_SWITCH, __gpio.HIGH)
        else:
            __gpio.output(__GPIO_AUTONOMOUS_SWITCH, __gpio.LOW)

    def setSpeed(self, percentage):
        if self.speed_controll is None:
            return
        if percentage == 0:
            self.speed_controll.stop()
        else:
            self.speed_controll.changeDutyCycle(percentage)

    def setFrequency(self, frequency: int):
        if self.speed_controll is None:
            return
        self.speed_controll.changeFrequency(frequency)

    def stop(self):
        if self.speed_controll is not None:
            self.speed_controll.stop()
            self.speed_controll = None
        __gpio.cleanup()
