from json import load as loadJson

with open("../data/pinlayout.json") as f:
    PIN_LAYOUT: dict[str:int] = loadJson(f)


class Servo:
    from gpiozero import PWMOutputDevice as __Servo
    from threading import Thread as __Thread, Lock as _Lock
    from time import sleep as __sleep

    __FREQUENCY = 2000  # in Hz
    __MAX_ANGLE = 90  # in deg
    __ROTATE_TIME = 0.02  # Time needed for Servo to rotate to angle for 1°
    __DEG_PER_CYCLE = 1  # Steeps per cycle

    __VALUES = {"MIN": 0.0, "MID": 1.5 / 3.3, "MAX": 3.0 / 3.3}

    def __init__(self):
        self.__lock = self._Lock()
        self.__isRotating = False
        self.__angle = 0
        self.__servo = self.__Servo(pin=PIN_LAYOUT["SERVO"], frequency=self.__FREQUENCY, initial_value=self.__VALUES["MID"])
        self.__enabled = True

    def close(self):
        if self.__enabled:
            self.__servo.close()
            self.__enabled = False
            self.__isRotating = False
            self.__angle = 0

    def startRotating(self, direction: int):
        if (direction != -1 and direction != 1) and self.__isRotating:
            return
        with self.__lock:
            self.__isRotating = True
        self.__Thread(target=self.__rotatingLoop, args=(direction,), daemon=True).start()

    def __rotatingLoop(self, direction: int):
        while self.__isRotating:
            if (direction == -1 and self.__angle == -self.__MAX_ANGLE) or (direction == 1 and self.__angle == self.__MAX_ANGLE):
                break
            self.setAngle(self.__angle + (self.__DEG_PER_CYCLE * direction))
            self.__sleep(self.__ROTATE_TIME * self.__DEG_PER_CYCLE)

    def stopRotating(self):
        with self.__lock:
            self.__isRotating = False

    def left(self):
        self.setAngle(-self.__MAX_ANGLE)

    def straight(self):
        self.setAngle(0)

    def right(self):
        self.setAngle(self.__MAX_ANGLE)

    def setAngle(self, angle):
        with self.__lock:
            self.__angle = angle
            self.__servo.value = self.__angleToValue(angle)

    def __angleToValue(self, angle):
        # -90° = 0 | 0° = ~0.45 | 90° = ~0.91
        if angle < -self.__MAX_ANGLE:
            angle = -self.__MAX_ANGLE
        elif angle > self.__MAX_ANGLE:
            angle = self.__MAX_ANGLE
        return (angle + self.__MAX_ANGLE) * (self.__VALUES["MID"] / self.__MAX_ANGLE)


class Lights:
    from gpiozero import OutputDevice as __OutputDevice

    def __init__(self):
        self.__light = self.__OutputDevice(pin=PIN_LAYOUT["LIGHTS"], initial_value=False)
        self.__enabled = True

    def close(self):
        if self.__enabled:
            self.__light.close()
            self.__enabled = False

    def on(self):
        if self.__enabled:
            self.__light.value = True

    def off(self):
        if self.__enabled:
            self.__light.value = False


class DistanceSensor:
    from gpiozero import DistanceSensor as Sensor

    def __init__(self, trigger: int, echo: int):
        self.enabled = False
        self.trigger = trigger
        self.echo = echo

    def start(self):
        if not self.enabled and self.trigger != None and self.echo != None:
            self.sensor = self.Sensor(trigger=self.trigger, echo=self.echo, queue_len=1, max_distance=5)

    def stop(self):
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


class Engine:
    from threading import Thread as __Thread, Lock as __Lock
    from time import sleep as __sleep, time as __time
    from gpiozero import PWMOutputDevice, OutputDevice

    __SPEED_FREQUENCY = 30  # in Hz
    __START_HELP = 0.5  # 500ms (time where engine is at 100%)

    autonomous: OutputDevice
    speed_control: PWMOutputDevice
    reverse: OutputDevice
    servo: Servo

    def __init__(self):
        self.enabled = False
        self.reverse_state = False
        self.lock = self.__Lock()
        self.oldTime = self.__time()

    def start(self):
        if not self.enabled:
            # self.autonomous = self.OutputDevice(pin=PIN_LAYOUT["AUTONOMOUS_SWITCH"], initial_value=False) TODO: Enable
            self.speed_control = self.PWMOutputDevice(pin=PIN_LAYOUT["SPEED"], frequency=self.__SPEED_FREQUENCY)
            self.reverse = self.OutputDevice(pin=PIN_LAYOUT["REVERSE"], initial_value=False)
            self.servo = Servo()
            self.oldTime = self.__time()
            self.enabled = True

    def stop(self):
        if self.enabled:
            self.servo.close()
            self.speed_control.close()
            self.reverse.close()
            # self.autonomous.close() TODO: Enable
            self.enabled = False

    def setAutonomousState(self, enabled: bool):
        if not self.enabled:
            return
        self.autonomous.value = enabled

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
            self.__sleep(0.05)  # 50ms

    def __setSpeed(self, value):
        self.speed_control.value = value

    def startRotating(self, direction: int):
        self.servo.startRotating(direction)

    def stopRotating(self):
        self.servo.stopRotating()
