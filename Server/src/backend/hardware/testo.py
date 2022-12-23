from gpiozero.pins.pigpio import PiGPIOFactory
from gpio import Servo
from time import sleep

FACTORY = PiGPIOFactory()
pin = 26

servo = Servo(factory=FACTORY, pin=pin)
sleep(0.5)

servo.left()

sleep(0.5)
servo.close()
sleep(0.05)
