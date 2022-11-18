from ina219 import INA219
from threading import Thread as __Thread, Lock as __Lock
from time import sleep

__ADRESS_SPEED = 0x40
__ADRESS_BATTERY = 0x41  # TODO: Check with sudo "i2cdetect -y 1" to get address
__MAX_SPEED_VOLTAGE = 42
__MAX_SPEED_VALUE = 47.7  # Without air resistance
__MAX_BATTERY_VOLTAGE = 84
__MIN_BATTERY_VOLTAGE = 60  # TODO: Check value
__R1_SPEED = 27
__R2_SPEED = 10
__R1_BATTERY = 10
__R2_BATTERY = 10

__lock = __Lock()
__ina_speed: INA219
__ina_battery: INA219
__isActive = False
__speed = 0
__battery = 0


def start():
    global __isActive, __ina_speed, __ina_battery
    __ina_speed = INA219(shunt_ohms=0.1, max_expected_amps=0.002, address=__ADRESS_SPEED)
    __ina_battery = INA219(shunt_ohms=0.1, max_expected_amps=0.002, address=__ADRESS_BATTERY)
    __ina_speed.configure(
        voltage_range=__ina_speed.RANGE_32V, gain=__ina_speed.GAIN_AUTO, bus_adc=__ina_speed.ADC_128SAMP, shunt_adc=__ina_speed.ADC_128SAMP
    )
    __ina_battery.configure(
        voltage_range=__ina_battery.RANGE_32V, gain=__ina_battery.GAIN_AUTO, bus_adc=__ina_battery.ADC_128SAMP, shunt_adc=__ina_battery.ADC_128SAMP
    )
    __isActive = True

    __Thread(target=__checkSpeed, daemon=True).start()
    __Thread(target=__checkBattery, daemon=True).start()


def stop():
    global __isActive, __lock

    if __isActive:
        with __lock:
            __isActive = False
            __ina_speed.reset()
            __ina_battery.reset()


def sendToServer(message):
    """Send messages to the server if speed or battery is updated."""
    pass


def __checkSpeed():
    global __isActive, __lock, __ina_speed, __speed
    while __isActive:
        sleep(0.50)  # 0.5s timeout
        while not __ina_battery.is_conversion_ready() and __isActive:
            sleep(0.1)
        speed = __calculate_speed(__ina_speed.voltage(), __R1_SPEED, __R2_SPEED)
        if speed != __speed:
            with __lock:
                # Update speed value
                __speed = speed
                sendToServer(f"speed:{__speed}")


def __checkBattery():
    global __isActive, __lock, __ina_battery, __battery
    while __isActive:
        __ina_battery.sleep()
        sleep(30)  # 30s timeout
        __ina_battery.wake()
        while not __ina_battery.is_conversion_ready() and __isActive:
            sleep(0.1)
        battery = __calculate_battery(__ina_battery.voltage(), __R1_BATTERY, __R2_BATTERY)
        if battery != __battery:
            with __lock:
                # Update battery value
                __battery = battery
                sendToServer(f"battery:{__battery}")


def __calculate_speed(vOut, r1, r2):
    # Vout = (Vin * R2) / (R1 + R2) -> Vin = (Vout * (R1 + R2)) / R2
    vIn = (vOut * (r1 + r2)) / r2
    speed = (vIn / __MAX_SPEED_VOLTAGE) * __MAX_SPEED_VALUE
    if speed > __MAX_SPEED_VALUE:
        speed = __MAX_SPEED_VALUE
    elif speed < 0:
        speed = 0
    return round(speed)


def __calculate_battery(vOut, r1, r2):
    # Vout = (Vin * R2) / (R1 + R2) -> Vin = (Vout * (R1 + R2)) / R2
    vIn = (vOut * (r1 + r2)) / r2
    # battery = (current_difference / max_differenz) * 100
    battery = ((vIn - __MIN_BATTERY_VOLTAGE) / (__MAX_BATTERY_VOLTAGE - __MIN_BATTERY_VOLTAGE)) * 100
    if battery > 100:
        battery = 100
    elif battery < 0:
        battery = 0
    return round(battery)
