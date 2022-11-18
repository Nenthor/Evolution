from socket import (
    socket as __socket,
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
__clients = set()
__server: __socket


def start():
    """Start the socket server, so that clients can connect to 127.0.0.1:5050."""
    global __clients
    __clients.clear()
    __Thread(target=__bootServer, daemon=True).start()


def stop():
    """Close the socket server"""
    global __server
    __server.close()
    __clients.clear()


def __bootServer():
    global __server, __lock
    __server = __socket(__AF_INET, __SOCK_STREAM)
    __server.setsockopt(__SOL_SOCKET, __SO_REUSEADDR, 1)
    __server.bind((__HOST, __PORT))
    __server.listen()
    print(f"Hardware is listening to {__HOST}:{__PORT}.")
    try:
        while True:
            conn, addr = __server.accept()
            with __lock:
                __clients.add(conn)
            __Thread(target=__handleClient, args=(conn, addr), daemon=True).start()
    except Exception:
        stop()


def __handleClient(conn: __socket, addr):
    global __lock

    print("Client has connected.")
    while True:
        try:
            msg_length = conn.recv(__HEADER).decode(__FORMAT)
            if msg_length:
                msg_length = int(msg_length)
                msg = conn.recv(msg_length).decode(__FORMAT)
                if msg == __DISCONNECT_MESSAGE:
                    print("Client has disconnected.")
                    __clients.remove(conn)
                    break
                onMessage(msg)
        except __error:
            print("Client has disconnected.")
            with __lock:
                __clients.remove(conn)
            break
    conn.close()


def send(message):
    """Send messages to all clients."""
    msg = message.encode(__FORMAT)

    for client in __clients:
        client.send(msg)


def onMessage(message):
    """Overwrite this function to receive messages from clients."""
    pass


def getClientCount():
    return len(__clients)
