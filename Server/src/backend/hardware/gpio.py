class DistanceSensor:
    from gpiozero.pins.pigpio import PiGPIOFactory
    from gpiozero import DistanceSensor as Sensor

    def __init__(self, trigger: int, echo: int):
        self.enabled = trigger != None and echo != None
        if self.enabled:
            self.FACTORY = self.PiGPIOFactory()
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
