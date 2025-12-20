# check_port.py
import socket


def check_port(port=5000):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()

    if result == 0:
        print(f"✅ Port {port} is open and accepting connections")
        return True
    else:
        print(f"❌ Port {port} is closed or not accepting connections")
        return False


if __name__ == "__main__":
    check_port(5000)