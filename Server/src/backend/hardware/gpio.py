from json import load as loadJson

with open("../data/pinlayout.json") as f:
    PIN_LAYOUT: dict[str:int] = loadJson(f)


class Servo:
    from gpiozero import PWMOutputDevice as __Servo
    from threading import Thread as __Thread, Lock as _Lock
    from time import sleep as __sleep

    __FREQUENCY = 333  # in Hz
    __MAX_ANGLE = 150  # in deg
    __MIDDLE_VALUE = 0  # start value: MAX_ANGLE + MIDDLE_VALUE <= 150
    __ROTATE_TIME = 0.02  # Time needed for Servo to rotate to angle for 1°
    __DEG_PER_CYCLE = 1  # Steeps per cycle

    __VALUES = {
        "MIN": (-__MAX_ANGLE + 150 + __MIDDLE_VALUE) / 300,
        "MID": (0 + 150 + __MIDDLE_VALUE) / 300,
        "MAX": (__MAX_ANGLE + 150 + __MIDDLE_VALUE) / 300,
    }

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
                self.stopRotating()
                break
            self.setAngle(self.__angle + (self.__DEG_PER_CYCLE * direction))
            self.__sleep(self.__ROTATE_TIME * self.__DEG_PER_CYCLE)

    def stopRotating(self):
        if self.__isRotating:
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
            self.__servo.value = self.__angleToValue(angle)
            self.__angle = self.__valueToAngle(self.__servo.value)
        print(f"DEG: {round(self.__angle, 2)}°\tPWM: {self.__servo.value}")

    def getAngle(self):
        return self.__angle

    def __angleToValue(self, angle):
        angle = max(min(angle, self.__MAX_ANGLE), -self.__MAX_ANGLE)  # cap angle to MAX_ANGLE
        value = (angle + 150 + self.__MIDDLE_VALUE) / 300
        return max(0, min(1, value))

    def __valueToAngle(self, value):
        angle = 300 * value - 150 - self.__MIDDLE_VALUE
        return max(min(angle, self.__MAX_ANGLE), -self.__MAX_ANGLE)


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
    from gpiozero import DistanceSensor as Sensor, PinSetInput as __Error

    sensor: Sensor

    def __init__(self, trigger: int, echo: int):
        self.enabled = False
        self.trigger = trigger
        self.echo = echo
        self.sensor = None

    def start(self):
        if not self.enabled and self.trigger != None and self.echo != None:
            self.sensor = self.Sensor(trigger=self.trigger, echo=self.echo, queue_len=1, max_distance=5, partial=True)
            self.enabled = True

    def stop(self):
        if self.enabled:
            if self.sensor != None:
                self.sensor.close()
                self.sensor = None
            self.enabled = False

    def isEnabled(self) -> bool:
        return self.enabled

    def enabledCheck(self) -> bool:
        if self.enabled:
            if self.sensor.active_time == None and self.sensor.inactive_time != None:
                if self.sensor.inactive_time > 1.0:
                    return False
            return True
        return False

    def getDistance(self) -> int:
        """Returns distance in cm (0cm - 500cm)"""
        distance = -1
        if self.enabled:
            distance = round(self.sensor.distance * 100)
        return distance


class Engine:
    from threading import Thread as __Thread, Lock as __Lock
    from time import sleep as __sleep, time as __time
    from gpiozero import PWMOutputDevice, OutputDevice

    __SPEED_FREQUENCY = 30  # in Hz
    __START_HELP = 0.5  # 500ms (time where engine is at 100%)
    __TIMEOUT = 0.1  # 100ms

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
        if time - self.oldTime > self.__TIMEOUT or speed == 0:
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

    def resetServo(self):
        self.servo.straight()

    def getAngle(self):
        return self.servo.getAngle()
