import socket as __socket
import threading as __threading

__HOST = "127.0.0.1"
__PORT = 5050
__HEADER = 16
__FORMAT = "utf-8"
__DISCONNECT_MESSAGE = "!DISCONNECT"

__lock = __threading.Lock()
__clients = set()


def __handleClient(conn, addr):
    global __clients
    print("Client has connected")
    while True:
        try:
            msg_length = conn.recv(__HEADER).decode(__FORMAT)
            if msg_length:
                msg_length = int(msg_length)
                msg = conn.recv(msg_length).decode(__FORMAT)
                if msg == __DISCONNECT_MESSAGE:
                    print("Client has disconnected")
                    __clients.remove(conn)
                    break
                onMessage(msg)
        except __socket.error:
            print("Client has disconnected")
            with __lock:
                __clients.remove(conn)
            break
    conn.close()


def __bootServer():
    global __clients
    server = __socket.socket(__socket.AF_INET, __socket.SOCK_STREAM)
    server.setsockopt(__socket.SOL_SOCKET, __socket.SO_REUSEADDR, 1)
    server.bind((__HOST, __PORT))
    server.listen()
    print(f"Hardware is listening to {__HOST}:{__PORT}")
    while True:
        conn, addr = server.accept()
        with __lock:
            __clients.add(conn)
        thread = __threading.Thread(
            target=__handleClient, args=(conn, addr), daemon=True)
        thread.start()


def start():
    """Start the socket server, so that clients can connect to 127.0.0.1:5050."""
    thread = __threading.Thread(target=__bootServer)
    thread.daemon = True
    thread.start()


def send(message):
    """Send messages to all clients."""
    msg = message.encode(__FORMAT)

    for c in __clients:
        thread = __threading.Thread(
            target=__sendToClient, args=(c, msg), daemon=True)
        thread.start()


def __sendToClient(client, message):
    client.send(message)


def onMessage(message):
    """Overwrite this function to receive messages from clients."""
    pass


def getClientCount():
    return len(__clients)
