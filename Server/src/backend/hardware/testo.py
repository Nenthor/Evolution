import gpio
from time import sleep
OUT = 0
IN = 1
BCM = 11

gpio.setwarnings(True)
gpio.setmode(BCM)

def testChannels(channel=-1):
    for index in range(27):
        if channel != -1:
            index = channel
        func = ''
        try:
            func:int = gpio.gpio_function(index)
            if func == IN:
                print(f"{index}\tIN")
            elif func == OUT:
                print(f"{index}\tOUT")
            else:
                print(f"{index}\t{func}")
        except ValueError as e:
            print(e)
        if channel != -1:
            break

channel1 = 13

testChannels(channel1)

PWM = gpio.PWM(channel1, 10)
testChannels(channel1)
PWM.stop()
"""
class PWM:
    import RPi.GPIO as GPIO

    def __init__(self, channel: int, frequency: int):
        self.GPIO.setmode(11)  # 11 = BCM
        self.GPIO.setwarnings(True)
        self.GPIO.setup(channel, 0)  # 0 = OUT ; 1 = IN
        self.channel = channel
        self.PWM = self.GPIO.PWM(channel, frequency)
        self.PWM.start(0)

    def changeFrequency(self, freq: int):
        self.PWM.ChangeFrequency(freq)

    def changeDutyCycle(self, dc: float):
        if 0 <= dc and dc <= 100:
            self.PWM.ChangeDutyCycle(dc)
        else:
            self.PWM.ChangeDutyCycle(0)
            print("{dc} is not a valid input for duty cycle.")

    def stop(self):
        self.PWM.stop()
        self.GPIO.cleanup(self.channel)
"""