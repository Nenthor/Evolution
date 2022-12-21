from gpiozero.pins.pigpio import PiGPIOFactory
from gpio import Servo
from time import sleep

FACTORY = PiGPIOFactory()
pin = 26
deg_max = 90

servo = Servo(factory=FACTORY, pin=pin, max_angle=deg_max)
sleep(0.5)

servo.left()

sleep(0.5)
servo.close()
sleep(0.05)
