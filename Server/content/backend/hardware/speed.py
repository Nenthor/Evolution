import time
import engine as __engine

# min_boot_percentage = 73
# min_normal_percantage = 33

speed = 80

engine:__engine.Engine = __engine.Engine()
"""
try:
    while True:
        if speed >= 100:
            break
        speed += 1
        print(speed)
        engine.setSpeed(speed)
        time.sleep(0.15)
    while True:
        if speed <= 0:
            break
        speed -= 1
        print(speed)
        engine.setSpeed(speed)
        time.sleep(0.5)
except KeyboardInterrupt:
    speed = 0
    engine.setSpeed(0)
    engine.stop()
"""
engine.setSpeed(80)
time.sleep(0.5)
engine.setSpeed(40)
time.sleep(2)
print('backwards.')
engine.setSpeed(0)
engine.setReverseState(True)
time.sleep(0.5)
engine.setSpeed(80)
print('GO!')
engine.setSpeed(80)
time.sleep(0.5)
engine.setSpeed(40)
time.sleep(2)

speed = 0
engine.setSpeed(0)
engine.stop()
