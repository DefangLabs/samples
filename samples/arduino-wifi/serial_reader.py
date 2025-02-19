import serial
import time

ser = serial.Serial('/dev/cu.usbserial-1110', 115200)  # Replace 'COM3' with your serial port

while True:
    if ser.in_waiting > 0:
        line = ser.readline().decode("utf-8").rstrip()
        print(f"Received: {line}")
    time.sleep(0.1)
