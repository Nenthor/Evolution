from gpiozero.pins.pigpio import PiGPIOFactory
from gpio import Servo
from time import sleep

FACTORY = PiGPIOFactory()
pin = 14
deg_min = -90
deg_max = 90

servo = Servo(factory=FACTORY, pin=pin, min=deg_min, max=deg_max)
sleep(0.5)



servo.close()
sleep(0.05)
