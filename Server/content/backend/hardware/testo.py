import gpio
import time
from ina219 import INA219


PIN = 21

gpio.setmode(gpio.BCM)
gpio.setwarnings(True)
"""
gpio.setup(PIN, gpio.OUT, initial=gpio.LOW)
print("start.")
gpio.output(PIN, gpio.HIGH)
time.sleep(3)
gpio.output(PIN, gpio.LOW)
"""

engine: gpio.PWM = gpio.PWM(PIN, 40)

speed = 50
while speed < 100:
    speed += 1
    engine.changeDutyCycle(speed)
    print(speed)
    time.sleep(0.1)

time.sleep(3)
gpio.cleanup()
print("done.")
"""

# sudo i2cdetect -y 1 -> get address
ina = INA219(shunt_ohms=0.1, max_expected_amps=0.2, address=0x40)
ina.configure(voltage_range=ina.RANGE_32V, gain=ina.GAIN_AUTO, bus_adc=ina.ADC_128SAMP, shunt_adc=ina.ADC_128SAMP)

print(ina.voltage())
"""
