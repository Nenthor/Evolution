class Engine:
    import engine_low

    def __init__(self):
        """First Engine activation."""
        self.isActive = False
        self.engine: self.engine_low.Engine

    def start(self):
        """Activate engine."""
        if not self.isActive:
            self.engine = self.engine_low.Engine()
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
            self.engine.setDirection(speed=0.6, reverse_state=False)
        elif direction == "BACKWARD":
            self.engine.setDirection(speed=0.6, reverse_state=True)
        elif direction == "LEFT":
            pass
        elif direction == "RIGHT":
            pass
