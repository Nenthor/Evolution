import os
from time import sleep

os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Set working directory to to file directory (.../backend/hardware/)
os.environ["GPIOZERO_PIN_FACTORY"] = "pigpio"

"""
DEG: f(x) = 60x - 150
NEW: f(x) = 60x -  90

_PI-%_|__S-%__|___V___|__deg__|_new-deg_
|  0% =    0% = 0.00V  = -150° = - 90°
|~45% =   30% = 1.50V  = - 60° =    0°
| 50% =   33% = 1.65V  = - 51° = +  9°
|~76% =   50% = 2.50V  =    0° = + 60°
|~91% =   60% = 3.00V  = + 30° = + 90°
|100% =   66% = 3.30V  = + 48° =   /
|152% =  100% = 5.00V  = +150° =   /

MAX-ANGLE: 198° ( >= 180° -> good )

--[ NEW PWM ]--
LEFT:      0.0
STRAIGHT: ~0.45
RIGHT:    ~0.91
"""

MAX_ANGLE = 90  # in deg
VALUES = {"MIN": 0.0, "MID": 1.5 / 3.3, "MAX": 3.0 / 3.3}

def angleToValue(angle):
    # -90° = 0 | 0° = ~0.45 | 90° = ~0.91
    if angle < -MAX_ANGLE:
        angle = -MAX_ANGLE
    elif angle > MAX_ANGLE:
        angle = MAX_ANGLE
    return (angle + MAX_ANGLE) * (VALUES["MID"] / MAX_ANGLE)


print(angleToValue(-90))
print(angleToValue(0))
print(angleToValue(90))
