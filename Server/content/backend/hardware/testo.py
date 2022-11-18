import gpio
import time
from ina219 import INA219


PIN = 5

gpio.setmode(gpio.BCM)
gpio.setwarnings(True)
"""
gpio.setup(PIN, gpio.OUT, initial=gpio.LOW)
print("start.")
gpio.output(PIN, gpio.HIGH)
time.sleep(3)
gpio.output(PIN, gpio.LOW)
"""

guidance: gpio.PWM = gpio.PWM(PIN, 333)

__MAX_ANGLE = 300


def angleToPercentage(angle: int):
    return round(((angle + __MAX_ANGLE / 2) / __MAX_ANGLE) * 100)


"""
angle = -25
while angle < 25:
    angle += 1
    guidance.changeDutyCycle(angleToPercentage(angle))
    print(f"{angle}°")
    time.sleep(0.1)
"""

guidance.changeDutyCycle(25)

time.sleep(2.5)
guidance.changeDutyCycle(75)
time.sleep(2.5)
gpio.cleanup()
print("done.")


"""
# sudo i2cdetect -y 1 -> get address
ina = INA219(shunt_ohms=0.1, max_expected_amps=0.001, address=0x40)
ina.configure(voltage_range=ina.RANGE_32V, gain=ina.GAIN_AUTO, bus_adc=ina.ADC_128SAMP, shunt_adc=ina.ADC_128SAMP)

print(ina.voltage())
"""
