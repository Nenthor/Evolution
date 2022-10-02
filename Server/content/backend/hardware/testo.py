import gpio
import time

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

engine:gpio.PWM = gpio.PWM(PIN, 100)
engine.st

gpio.cleanup()
print("done.")