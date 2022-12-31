from socket import (
    socket as __socket,
    SHUT_RDWR as __SHUT_RDWR,
    error as __error,
    AF_INET as __AF_INET,
    SOCK_STREAM as __SOCK_STREAM,
    SOL_SOCKET as __SOL_SOCKET,
    SO_REUSEADDR as __SO_REUSEADDR,
)
from threading import Thread as __Thread, Lock as __Lock

__HOST = "127.0.0.1"
__PORT = 5050
__HEADER = 2
__FORMAT = "utf-8"
__DISCONNECT_MESSAGE = "!DISCONNECT"

__lock = __Lock()
__isActive = False
__client: __socket = None
__server: __socket = None


def start():
    """Start the socket server, so that clients can connect to 127.0.0.1:5050."""
    global __isActive, __server
    if not __isActive:
        __isActive = True
        __Thread(target=__bootServer, daemon=True).start()


def stop():
    """Close the socket server"""
    global __isActive, __server, __client
    if __isActive:
        __isActive = False
        __server.shutdown(__SHUT_RDWR)


def __bootServer():
    global __isActive, __server, __client, __lock
    __server = __socket(__AF_INET, __SOCK_STREAM)
    __server.setsockopt(__SOL_SOCKET, __SO_REUSEADDR, 1)
    __server.bind((__HOST, __PORT))
    __server.listen()
    print(f"Hardware is listening to {__HOST}:{__PORT}.")
    try:
        while __isActive:
            conn, addr = __server.accept()
            with __lock:
                __client = conn
            __Thread(target=__handleClient, args=(conn, addr), daemon=True).start()
    except __error as e:
        if not __isActive:
            return  # Normal server shutdown
        print("N", e)
    except Exception as e:
        print(e)
    stop()


def __handleClient(conn: __socket, addr):
    global __isActive, __client, __lock, __server
    print("Client has connected.")
    try:
        while __isActive:
            msg_length = conn.recv(__HEADER).decode(__FORMAT)
            if msg_length:
                msg_length = int(msg_length)
                msg = conn.recv(msg_length).decode(__FORMAT)
                if msg == __DISCONNECT_MESSAGE:
                    print("Client has disconnected.")
                    with __lock:
                        __client = None
                    break
                onMessage(msg)
    except __error as e:
        print(e)
        print("Client has disconnected.")
    with __lock:
        conn.close()
        __client = None
    onMessage("disconnected")


def send(message: str):
    """Send messages to all clients."""
    global __client
    if __client != None:
        msg = message.encode(__FORMAT)
        __client.send(msg)


def onMessage(message):
    """Overwrite this function to receive messages from clients."""
    pass
