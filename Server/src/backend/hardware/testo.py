import os
from time import sleep

os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Set working directory to to file directory (.../backend/hardware/)
os.environ["GPIOZERO_PIN_FACTORY"] = "pigpio"

"""
DEG: f(x) = 300x - 150      (x -> PI-%)

_PI-%_|__deg__|
|  0% = -150°
| 20% = - 90°  
| 50% =    0°
| 80% =   90°
|100% = +150° 

--[ NEW PWM ]--
LEFT:      0.2
STRAIGHT:  0.5
RIGHT:     0.8
"""

MAX_ANGLE = 60  # in deg
VALUES = {"MIN": (-MAX_ANGLE + 150) / 300, "MID": (0 + 150) / 300, "MAX": (MAX_ANGLE + 150) / 300}

def angleToValue(angle):
    angle = max(min(angle, MAX_ANGLE), -MAX_ANGLE) # cap angle to MAX_ANGLE
    return (angle + 150) / 300

def valueToAngle(value):
    return 300 * value - 150 


# Speed & Battery test

__MAX_SPEED_VOLTAGE = 42
__MAX_SPEED_VALUE = 35.0  # Value from tracker app
__MAX_BATTERY_VOLTAGE = 84  # vIn ~ 22.71 V
__MIN_BATTERY_VOLTAGE = 60  # vIn ~ 16.22 V TODO: Check value
__R1_SPEED = 10
__R2_SPEED = 10
__R1_BATTERY = 27
__R2_BATTERY = 10

def calculate_battery(vOut):
    # Vout = (Vin * R2) / (R1 + R2) -> Vin = (Vout * (R1 + R2)) / R2
    vIn = (vOut * (__R1_BATTERY + __R2_BATTERY)) / __R2_BATTERY
    print("vIn:", vIn)
    # battery = (current_difference / max_differenz) * 100
    battery = ((vIn - __MIN_BATTERY_VOLTAGE) / (__MAX_BATTERY_VOLTAGE - __MIN_BATTERY_VOLTAGE)) * 100
    print("battery:", round(max(0, min(100, battery))))
    return round(max(0, min(100, battery)))
