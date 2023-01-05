class Engine:
    from gpio import Engine as __Engine
    import autonomous

    def __init__(self):
        """Setup Engine."""
        self.isActive = False
        self.old_direction = "STANDBY"
        self.engine = self.__Engine()
        self.camera = [0, 0, 0]
        self.autonomous.setServo = self.engine.setAngle

    def start(self):
        """Activate engine."""
        if not self.isActive:
            self.engine.start()
            self.isActive = True

    def stop(self):
        """Deactivate engine."""
        if self.isActive:
            self.engine.stop()
            self.autonomous.cancel()
            self.isActive = False

    def sendToServer(self, message):
        """Send messages to the server if engine is updated."""
        pass

    def onRemoteControll(self, enabled):
        if enabled:
            self.start()
        else:
            self.stop()

    def servoReset(self):
        self.engine.resetServo()

    def onRemotedirection(self, direction):
        if not self.isActive:
            return

        if self.old_direction == "LEFT" or self.old_direction == "RIGHT":
            self.engine.stopRotating()
        check = self.cameraCheck(direction)
        if not check:
            self.brake()

        if direction == "STANDBY":
            self.engine.setDirection(speed=0, reverse_state=False)
        elif direction == "FORWARD":
            self.engine.setDirection(speed=0.6, reverse_state=False)
        elif direction == "BACKWARD":
            self.engine.setDirection(speed=0.6, reverse_state=True)
        elif direction == "LEFT":
            self.engine.startRotating(direction=-1)
        elif direction == "RIGHT":
            self.engine.startRotating(direction=1)
        else:
            return
        self.old_direction = direction

    def onNewCameraData(self, camera: list[int]):
        self.camera = camera
        self.cameraCheck(self.old_direction)

    def cameraCheck(self, direction: str):
        isValid = False
        if direction == "STANDBY" or direction == "LEFT" or direction == "RIGHT":
            isValid = True
        elif direction == "BACKWARD":
            isValid = True
        elif direction == "FORWARD":
            angle = self.engine.servo.getAngle()
            if self.camera[1] != 0 or self.camera[0] == 3 or self.camera[2] == 3:
                isValid = False
            elif (angle <= -3 and self.camera[0] >= 2) or (angle >= 1 and self.camera[2] >= 2):
                isValid = False
            elif (angle <= -5 and self.camera[0] != 0) or (angle >= 5 and self.camera[2] != 0):
                isValid = False
            else:
                isValid = True
        else:
            isValid = False

        if not isValid:
            self.brake()
        return isValid

    def brake(self):
        self.onRemotedirection("STANDBY")

    def setTarget(self, msg: str):
        if msg == "-1":
            self.autonomous.cancel()
            return
        values = msg.split(";")
        lat = float(values[0])
        long = float(values[1])
        dLat = float(values[2])
        dLong = float(values[3])
        self.autonomous.setTarget(lat, long, dLat, dLong)
    
    def updateDegree(self, deg):
        self.autonomous.updateDegree(deg)

    def updatePosition(self, lat, long):
        self.autonomous.updatePosition(lat, long)
