import os
from time import sleep

os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Set working directory to to file directory (.../backend/hardware/)
os.environ["GPIOZERO_PIN_FACTORY"] = "pigpio"
