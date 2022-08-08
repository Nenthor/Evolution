from time import sleep
import server

server.start()

def onMessage(message):
    print(message)
server.onMessage = onMessage
