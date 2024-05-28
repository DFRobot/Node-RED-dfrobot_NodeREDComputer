# -*- coding: utf-8 -*-

import subprocess
import time
import serial
import ctypes
import re

import paho.mqtt.client as mqtt
import uuid
import json
import time
import argparse


# 连接成功回调函数
def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))

# 发布消息回调函数
def on_publish(client, userdata, mid):
    print("Message published")



# -----------------------------------------------------------------------------------------串口控制
'''
    打开串口
    返回值：串口打开成功——>返回串口对象      串口打开失败——>-1
'''
def Open_Serial_Port(port, baudrate=9600, timeout=1):
    try:
        ser = serial.Serial(port, baudrate, timeout=timeout)
        print("Serial Open")   # REN-调试（后期注释）
        return ser
    except serial.SerialException as e:
        print(f"Serial Open error: {e}")
        return -1


'''
    发送命令并打印返回内容
    返回值：1、AT返回超时   2、发送AT出错
'''
def Serial_Send_cmd(ser, responseTime, cmd, endMark):
    if ser is not -1 and ser.isOpen():
        try:
            byte_endMark = None
            serial_command = None
            if endMark == "CR":
                byte_endMark = bytes.fromhex("0D")
            elif endMark == "LF":
                byte_endMark = bytes.fromhex("0A")
            elif endMark == "CRLF":
                byte_endMark = bytes.fromhex("0D0A")

            if byte_endMark != None:
                serial_command = cmd.encode() + byte_endMark
            else:
                serial_command = cmd.encode()   # 将字符串 cmd 编码为字节对象，以便进行网络通信
            print(serial_command)
            ser.write(serial_command)  # 向串口发送指令
            # 等待响应的时间(默认1s)
            if responseTime.isdigit():
                time.sleep(int(responseTime))
            else:
                time.sleep(1)
            response = ser.read_all()  # 读取返回的内容
            print("response: ", response.decode())      # REN-调试（后期注释）
            return response.decode()
        except serial.SerialException as e:
            print(f"Send AT error: {e}")   # REN-调试（后期注释）
            return -1




'''
    关闭串口  
'''
def Close_Serial_Port(ser):
    if ser is not -1 and ser.isOpen():
        ser.close()
        print("Serial Close")   # REN-调试（后期注释）




# -----------------------------------------------------------------------------------------串口通信的封装
'''
    返回值：串口反回值
    特殊情况：1、打不开串口    2、串口返回值为空<串口等待返回值超时>
'''
def serial_communication(port, baudrate, responseTime, cmd, endMark=None):
    serial_obj = -1
    return_msg = ""
    serial_obj = Open_Serial_Port(port=port, baudrate=baudrate)
    if serial_obj == -1:
        return_msg = "Failed to open the serial port"
    else:   
        # 串口已打开
        time.sleep(0.5)
        # response = Serial_Send_cmd(serial_obj, 'AT+SN?\r\n') 
        response = Serial_Send_cmd(serial_obj, responseTime, cmd, endMark) 
        # response = Serial_Send_cmd(serial_obj, '|2|1|dfrobotGuest,dfrobot2020|') 
        return_msg = response
    Close_Serial_Port(serial_obj)
    return return_msg


# -----------------------------------------------------------------------------------------主逻辑函数
def main():
# 1、获取输入参数
    # eg. python3 serialEvent.py -port /dev/ttyACM0 -cmd AT+SN?\r\n -uuid 1234567 -baudrate 115200
    # eg. python3 serialEvent.py -port /dev/ttyUSB0 -baudrate 9600 -cmd "|2|1|dfrobotGuest,dfrobot2020|" -uuid 1234567 

    parser = argparse.ArgumentParser(description='Python script with command line arguments')
    parser.add_argument('-port', type=str, help='An string')    # eg. /dev/ttyACM0
    parser.add_argument('-baudrate', type=str, help='An string')    # eg. 9600或115200
    parser.add_argument('-responseTime', type=str, help='An string')    # eg. 等待串口响应的时间
    parser.add_argument('-cmd', type=str, help='An string')     # eg. AT+SN?
    parser.add_argument('-endMark', type=str, help='An string')     # eg. \r\n
    parser.add_argument('-uuid', type=str, help='An string')    # eg. uuid
    args = parser.parse_args()
    
# 2、MQTT配置
    client_id = f"python_mqtt_{uuid.uuid4()}"   # 生成一个唯一的客户端ID
    mqtt_broker = "localhost"   # MQTT服务器设置
    mqtt_port = 1883
    client = mqtt.Client(client_id=client_id, clean_session=False)  # 创建 MQTT 客户端实例，启用持久会话
    client.on_connect = on_connect    # 设置连接回调函数
    client.on_publish = on_publish    # 指定发布消息的回调函数
    client.connect(mqtt_broker, mqtt_port, keepalive=60)    # 连接到MQTT Broker(代理服务器)

# 3、打开串口——>发送cmd——>串口返回值——>关闭串口
    response = serial_communication(args.port, args.baudrate, args.responseTime, args.cmd, args.endMark)

# 4、将串口返回值通过MQTT发布出去
    topic = f"serial/communication/{args.uuid}"
    message = {'serial_response': response}
    client.publish(topic, json.dumps(message))
    print(topic, "      ", message)

    client.disconnect() # 断开连接


main()