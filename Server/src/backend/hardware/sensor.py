class DistanceSensor:
    from time import sleep as __sleep
    from threading import Thread as __Thread, Lock as __Lock
    from gpio import DistanceSensor as __DistanceSensor

    __SENSORS = [
        {"trigger": None, "echo": None},
        {"trigger": 23, "echo": 24},
        {"trigger": None, "echo": None},
    ]
    sensors: list[__DistanceSensor]

    def __init__(self):
        self.isActive = False
        self.lock = self.__Lock()
        self.outOfRangeCount: list[int]

    def start(self):
        """Activate sensors."""
        if not self.isActive:
            self.isActive = True
            self.outOfRangeCount = [0, 0, 0]
            self.sensors = [None, None, None]
            self.__setupSensors()
            self.__Thread(target=self.__startLoop, daemon=True).start()

    def stop(self):
        """Deactivate sensors."""
        if self.isActive:
            self.isActive = False
            for sensor in self.sensors:
                sensor.stop()

    def changeState(self, state):
        if state == "0":
            self.stop()
        elif state == "1":
            self.start()

    def __startLoop(self):
        try:
            while self.isActive:
                self.__sleep(0.06)
                for index, sensor in enumerate(self.sensors):
                    if sensor.isEnabled():
                        self.__onData(index, sensor.getDistance())
        except Exception as e:
            print(e)
            self.stop()

    def __onData(self, index, distance):
        if self.checkData(index, distance):
            self.updateCamera(index, distance)

    def checkData(self, index, distance) -> bool:
        if distance != 500 or self.outOfRangeCount[index] >= 10:
            with self.lock:
                self.outOfRangeCount[index] = 0
            return True
        else:
            with self.lock:
                self.outOfRangeCount[index] += 1
            return False

    def __setupSensors(self):
        for index, sensor in enumerate(self.__SENSORS):
            self.sensors[index] = self.__DistanceSensor(trigger=sensor["trigger"], echo=sensor["echo"])

    def updateCamera(self, index: int, distance: int):
        """Overwrite this function to receive distances from sensors."""
        pass


class SpeedBatterySensor:
    from ina219 import INA219 as __INA219
    from threading import Thread as __Thread, Lock as __Lock
    from time import sleep as __sleep

    __ADRESS_SPEED = 0x40
    __ADRESS_BATTERY = 0x41  # TODO: Check with sudo "i2cdetect -y 1" to get address
    __MAX_SPEED_VOLTAGE = 42
    __MAX_SPEED_VALUE = 35.0  # Value from tracker app
    __MAX_BATTERY_VOLTAGE = 84
    __MIN_BATTERY_VOLTAGE = 60  # TODO: Check value
    __R1_SPEED = 27
    __R2_SPEED = 10
    __R1_BATTERY = 10
    __R2_BATTERY = 10

    __ina_speed: __INA219
    __ina_battery: __INA219

    def __init__(self):
        self.lock = self.__Lock()
        self.isActive = False
        self.speed = 0
        self.battery = 0

    def start(self):
        if self.isActive:
            return
        self.__ina_speed = self.__INA219(shunt_ohms=0.1, max_expected_amps=0.002, address=self.__ADRESS_SPEED)
        self.__ina_battery = self.__INA219(shunt_ohms=0.1, max_expected_amps=0.002, address=self.__ADRESS_BATTERY)
        self.__ina_speed.configure(
            voltage_range=self.__ina_speed.RANGE_32V,
            gain=self.__ina_speed.GAIN_AUTO,
            bus_adc=self.__ina_speed.ADC_128SAMP,
            shunt_adc=self.__ina_speed.ADC_128SAMP,
        )
        self.__ina_battery.configure(
            voltage_range=self.__ina_battery.RANGE_32V,
            gain=self.__ina_battery.GAIN_AUTO,
            bus_adc=self.__ina_battery.ADC_128SAMP,
            shunt_adc=self.__ina_battery.ADC_128SAMP,
        )
        self.isActive = True

        self.__Thread(target=self.__checkSpeed, daemon=True).start()
        self.__Thread(target=self.__checkBattery, daemon=True).start()

    def stop(self):
        if self.isActive:
            with self.lock:
                self.isActive = False
                self.__ina_speed.reset()
                self.__ina_battery.reset()

    def sendToServer(self, message):
        """Send messages to the server if speed or battery is updated."""
        pass

    def forceUpdate(self, type):
        if not self.isActive:
            return
        if type == "speed":
            self.sendToServer(f"speed:{self.speed}")
        elif type == "battery":
            self.sendToServer(f"battery:{self.battery}")

    def __checkSpeed(self):
        while self.isActive:
            self.__sleep(0.50)  # 0.5s timeout
            while not self.__ina_battery.is_conversion_ready() and self.isActive:
                self.__sleep(0.1)
            speed = self.__calculate_speed(self.__ina_speed.voltage(), self.__R1_SPEED, self.__R2_SPEED)
            if speed != self.speed:
                with self.lock:
                    # Update speed value
                    self.speed = speed
                    self.sendToServer(f"speed:{self.speed}")

    def __checkBattery(self):
        while self.isActive:
            self.__ina_battery.sleep()
            self.__sleep(30)  # 30s timeout
            self.__ina_battery.wake()
            while not self.__ina_battery.is_conversion_ready() and self.isActive:
                self.__sleep(0.1)
            battery = self.__calculate_battery(self.__ina_battery.voltage(), self.__R1_BATTERY, self.__R2_BATTERY)
            if battery != __battery:
                with self.lock:
                    # Update battery value
                    __battery = battery
                    self.sendToServer(f"battery:{__battery}")

    def __calculate_speed(self, vOut, r1, r2):
        # Vout = (Vin * R2) / (R1 + R2) -> Vin = (Vout * (R1 + R2)) / R2
        vIn = (vOut * (r1 + r2)) / r2
        speed = (vIn / self.__MAX_SPEED_VOLTAGE) * self.__MAX_SPEED_VALUE
        if speed > self.__MAX_SPEED_VALUE:
            speed = self.__MAX_SPEED_VALUE
        elif speed < 0:
            speed = 0
        return round(speed)

    def __calculate_battery(self, vOut, r1, r2):
        # Vout = (Vin * R2) / (R1 + R2) -> Vin = (Vout * (R1 + R2)) / R2
        vIn = (vOut * (r1 + r2)) / r2
        # battery = (current_difference / max_differenz) * 100
        battery = ((vIn - self.__MIN_BATTERY_VOLTAGE) / (self.__MAX_BATTERY_VOLTAGE - self.__MIN_BATTERY_VOLTAGE)) * 100
        if battery > 100:
            battery = 100
        elif battery < 0:
            battery = 0
        return round(battery)
