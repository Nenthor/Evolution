from json import load as loadJson

with open("../data/pinlayout.json") as f:
    PIN_LAYOUT: dict[str:int] = loadJson(f)


class DistanceSensor:
    from time import sleep as __sleep, time as __time
    from threading import Thread as __Thread, Lock as __Lock
    from gpio import DistanceSensor as __DistanceSensor

    __SENSORS = [
        {"trigger": PIN_LAYOUT["TRIGGER_1"], "echo": PIN_LAYOUT["ECHO_1"]},
        {"trigger": PIN_LAYOUT["TRIGGER_2"], "echo": PIN_LAYOUT["ECHO_2"]},
        {"trigger": PIN_LAYOUT["TRIGGER_3"], "echo": PIN_LAYOUT["ECHO_3"]},
    ]
    sensors: list[__DistanceSensor]

    def __init__(self):
        self.isActive = False
        self.lock = self.__Lock()
        self.outOfRangeCount: list[int]
        self.cameraListeners: list[str] = []
        self.oldTime = self.__time()
        self.currentActionID = 0
        self.deactivationInfo = [False, False, False]
        self.sensors = [None, None, None]
        self.__setupSensors()

    def start(self):
        """Activate sensors."""
        if not self.isActive:
            currentTime = self.__time()
            if currentTime - self.oldTime >= 1.0:
                self.isActive = True
                self.oldTime = currentTime
                self.outOfRangeCount = [0, 0, 0]
                self.__Thread(target=self.__startLoop, daemon=True).start()
            else:
                delay = 1 - (currentTime - self.oldTime)
                with self.lock:
                    self.currentActionID += 1
                self.__Thread(target=self.__delayAction, args=(delay, "start", self.currentActionID), daemon=True).start()

    def stop(self):
        """Deactivate sensors."""
        if self.isActive:
            currentTime = self.__time()
            if currentTime - self.oldTime >= 1.0:
                self.isActive = False
                self.oldTime = self.__time()
            else:
                delay = 1 - (currentTime - self.oldTime)
                with self.lock:
                    self.currentActionID += 1
                self.__Thread(target=self.__delayAction, args=(delay, "stop", self.currentActionID), daemon=True).start()

    def close(self):
        for index, sensor in enumerate(self.__SENSORS):
            if self.sensors[index] != None:
                self.sensors[index].stop()

    def addListener(self, listener: str):
        if not listener in self.cameraListeners:
            if len(self.cameraListeners) == 0:
                self.start()
            self.cameraListeners.append(listener)

    def removeListener(self, listener: str):
        if listener in self.cameraListeners:
            self.cameraListeners.remove(listener)
            if len(self.cameraListeners) == 0:
                self.stop()

    def __delayAction(self, delay: float, action: str, id: int):
        self.__sleep(delay)
        with self.lock:
            if self.currentActionID == id:
                if action == "start":
                    self.start()
                elif action == "stop":
                    self.stop()

    def __startLoop(self):
        while self.isActive:
            self.__sleep(0.06)
            for index, sensor in enumerate(self.sensors):
                if sensor == None:
                    continue
                if sensor.isEnabled():
                    distance = sensor.getDistance()
                    if distance == 0:
                        self.__enabledCheck(index)
                    else:
                        self.__onData(index, distance)

    def __setupSensors(self):
        for index, sensor in enumerate(self.__SENSORS):
            self.sensors[index] = self.__DistanceSensor(trigger=sensor["trigger"], echo=sensor["echo"])
            self.sensors[index].start()

    def __enabledCheck(self, index) -> bool:
        if not self.sensors[index].enabledCheck():
            self.sensors[index].stop()
            self.sensors[index] = None
            if not self.deactivationInfo[index]:
                self.deactivationInfo[index] = True
                print(f"DistanceSensor {index + 1} is not connected.")
            for index, sensor in enumerate(self.sensors):
                if sensor != None:
                    break
                if index == len(self.sensors) - 1:
                    self.stop()
            return False
        return True

    def __onData(self, index, distance):
        if self.__checkData(index, distance):
            self.updateCamera(index, distance)

    def __checkData(self, index, distance) -> bool:
        if distance != 500 or self.outOfRangeCount[index] >= 10:
            with self.lock:
                self.outOfRangeCount[index] = 0
            return True
        else:
            with self.lock:
                self.outOfRangeCount[index] += 1
            return False

    def updateCamera(self, index: int, distance: int):
        """Overwrite this function to receive distances from sensors."""
        pass


class SpeedBatterySensor:
    from ina219 import INA219 as __INA219
    from threading import Thread as __Thread, Lock as __Lock
    from os import error as __error
    from time import sleep as __sleep

    __ADRESS_SPEED = int(f"0x{PIN_LAYOUT['ADRESS_SPEED']}", 16)
    __ADRESS_BATTERY = int(f"0x{PIN_LAYOUT['ADRESS_BATTERY']}", 16)
    __MAX_SPEED_VOLTAGE = 42
    __MAX_SPEED_VALUE = 35.0  # Value from tracker app
    __MAX_BATTERY_VOLTAGE = 84
    __MIN_BATTERY_VOLTAGE = 60  # TODO: Check value
    __R1_SPEED = 10
    __R2_SPEED = 10
    __R1_BATTERY = 27
    __R2_BATTERY = 10

    __ina_speed: __INA219
    __ina_battery: __INA219

    def __init__(self):
        self.lock = self.__Lock()
        self.isActive = {"speed": False, "battery": False}
        self.__speed = 0
        self.__battery = 0

    def start(self):
        if not self.isActive["speed"]:
            try:
                self.__ina_speed = self.__INA219(shunt_ohms=0.1, max_expected_amps=0.002, address=self.__ADRESS_SPEED)
                self.__ina_speed.configure(
                    voltage_range=self.__ina_speed.RANGE_32V,
                    gain=self.__ina_speed.GAIN_AUTO,
                    bus_adc=self.__ina_speed.ADC_128SAMP,
                    shunt_adc=self.__ina_speed.ADC_128SAMP,
                )
                self.isActive["speed"] = True
                self.__Thread(target=self.__checkSpeed, daemon=True).start()
            except self.__error:
                print("Speed sensor is not connected.")
        if not self.isActive["battery"]:
            try:
                self.__ina_battery = self.__INA219(shunt_ohms=0.1, max_expected_amps=0.002, address=self.__ADRESS_BATTERY)
                self.__ina_battery.configure(
                    voltage_range=self.__ina_battery.RANGE_32V,
                    gain=self.__ina_battery.GAIN_AUTO,
                    bus_adc=self.__ina_battery.ADC_128SAMP,
                    shunt_adc=self.__ina_battery.ADC_128SAMP,
                )
                self.isActive["battery"] = True
                self.__Thread(target=self.__checkBattery, daemon=True).start()
            except self.__error:
                print("Battery sensor is not connected.")

    def stop(self):
        with self.lock:
            if self.isActive["speed"]:
                self.__ina_speed.reset()
                self.isActive["speed"] = False
            if self.isActive["battery"]:
                self.__ina_battery.reset()
                self.isActive["battery"] = False

    def sendToServer(self, message):
        """Send messages to the server if speed or battery is updated."""
        pass

    def forceUpdate(self, type):
        if not self.isActive[type]:
            return
        if type == "speed":
            self.sendToServer(f"speed:{self.__speed}")
        elif type == "battery":
            self.sendToServer(f"battery:{self.__battery}")

    def __checkSpeed(self):
        while self.isActive["speed"]:
            self.__sleep(0.50)  # 0.5s timeout
            while not self.__ina_battery.is_conversion_ready() and self.isActive["speed"]:
                self.__sleep(0.1)
            speed = self.__calculate_speed(self.__ina_speed.voltage())
            if speed != self.speed:
                with self.lock:
                    # Update speed value
                    self.speed = speed
                    self.sendToServer(f"speed:{self.speed}")

    def __checkBattery(self):
        while self.isActive["battery"]:
            self.__ina_battery.sleep()
            self.__sleep(3)  # 30s timeout
            self.__ina_battery.wake()
            while not self.__ina_battery.is_conversion_ready() and self.isActive["battery"]:
                self.__sleep(0.1)
            battery = self.__calculate_battery(self.__ina_battery.voltage())
            if battery != self.__battery:
                with self.lock:
                    # Update battery value
                    self.__battery = battery
                    self.sendToServer(f"battery:{self.__battery}")

    def __calculate_speed(self, vOut):
        # Vout = (Vin * R2) / (R1 + R2) -> Vin = (Vout * (R1 + R2)) / R2
        vIn = (vOut * (self.__R1_SPEED + self.__R2_SPEED)) / self.__R2_SPEED
        # speed = (current_difference) * MAX_SPEED_VALUE
        speed = (vIn / self.__MAX_SPEED_VOLTAGE) * self.__MAX_SPEED_VALUE
        return round(max(0, min(self.__MAX_SPEED_VALUE, speed)))

    def __calculate_battery(self, vOut):
        # Vout = (Vin * R2) / (R1 + R2) -> Vin = (Vout * (R1 + R2)) / R2
        vIn = (vOut * (self.__R1_BATTERY + self.__R2_BATTERY)) / self.__R2_BATTERY
        # battery = (current_difference / max_differenz) * 100
        battery = ((vIn - self.__MIN_BATTERY_VOLTAGE) / (self.__MAX_BATTERY_VOLTAGE - self.__MIN_BATTERY_VOLTAGE)) * 100
        return round(max(0, min(100, battery)))
