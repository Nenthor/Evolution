import socket as __socket
import threading as __threading
from time import sleep as __sleep
import atexit as __atexit

__HOST = "127.0.0.1"
__PORT = 5050
__HEADER = 64
__FORMAT = "utf-8"
__DISCONNECT_MESSAGE = "!DISCONNECT"

__client = None
__retryCount = 0
__isConnected = False
__messageQueue = set()


def connect():
    """Connect to the Server as a client."""
    thread = __threading.Thread(target=__connectToServer, daemon=True)
    thread.daemon = True
    thread.start()


def __connectToServer():
    global __isConnected, __retryCount, __client, __messageQueue
    try:
        __client = __socket.socket(__socket.AF_INET, __socket.SOCK_STREAM)
        __client.connect((__HOST, __PORT))

        print("Connected to Hardware.")
        __isConnected = True
        __retryCount = 0

        while __isConnected:
            if len(__messageQueue) != 0:
                for message in __messageQueue.copy():
                    __sendToServer(message)
                    __messageQueue.remove(message)
                print(len(__messageQueue))
    except __socket.error:
        if __retryCount == 0:
            print("Hardware connection is closed. Retrying...")

        __sleep(1)
        __retryCount += 1

        if __retryCount >= 300:
            print("Could not establish connection to Hardware.")
        else:
            __connectToServer()


def __sendToServer(message):
    global __client, __isConnected
    if __isConnected:
        msg = message.encode(__FORMAT)
        msg_length = len(msg)
        send_length = str(msg_length).encode(__FORMAT)
        send_length += b' ' * (__HEADER - len(send_length))
        __client.send(send_length)
        __client.send(msg)


def send(message):
    """Send messages to the server."""
    global __messageQueue
    __messageQueue.add(message)


def disconnect():
    """Disconnect from the Server. Does not need to be called before exiting."""
    global __isConnected, __messageQueue
    if __isConnected:
        send(__DISCONNECT_MESSAGE)
        __isConnected = False
        __messageQueue.clear()
        print("Disconnected from Hardware.")


__atexit.register(disconnect)
