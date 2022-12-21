class Engine:
    from gpio import Engine as __Engine

    def __init__(self, factory):
        """First Engine activation."""
        self.isActive = False
        self.engine = self.__Engine(factory)

    def start(self):
        """Activate engine."""
        if not self.isActive:
            self.engine.start()
            self.isActive = True

    def stop(self):
        """Deactivate engine."""
        if self.isActive:
            self.engine.stop()
            self.isActive = False

    def sendToServer(self, message):
        """Send messages to the server if engine is updated."""
        pass

    def onRemoteControll(self, enabled):
        if enabled:
            self.start()
        else:
            self.stop()

    def onRemotedirection(self, direction):
        if not self.isActive:
            return
        if direction == "STANDBY":
            self.engine.setDirection(speed=0, reverse_state=False)
        elif direction == "FORWARD":
            self.engine.setDirection(speed=0.5, reverse_state=False)
        elif direction == "BACKWARD":
            self.engine.setDirection(speed=0.5, reverse_state=True)
        elif direction == "LEFT":
            pass
        elif direction == "RIGHT":
            pass
