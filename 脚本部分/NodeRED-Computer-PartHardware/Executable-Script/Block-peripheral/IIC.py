# -*- coding: utf-8 -*-

import subprocess
import time
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


def execute_command(command):
    return_msg = None
    try:
        # 使用subprocess.run来运行命令，capture_output=True捕获输出
        result = subprocess.run(command, shell=True, text=True, capture_output=True, check=True)
        # 打印标准输出
        print("Output:", result.stdout)
        return_msg = result.stdout
        return return_msg
    except subprocess.CalledProcessError as e:
        # 捕获错误，打印标准错误信息
        print("An error occurred:", e.stderr)
        return_msg = "An error occurred:" + e.stderr
        return return_msg
    except Exception as e:
        # 处理其他异常
        print("An unexpected error occurred:", str(e))
        return_msg = "An unexpected error occurred:" + str(e)
        return return_msg


# -----------------------------------------------------------------------------------------IIC通信的封装
'''
    返回值：串口反回值
    特殊情况：1、打不开串口    2、串口返回值为空<串口等待返回值超时>
'''
def IIC_communication(bus, address, mode, command):
    # eg. i2cset -y 2 0x16 0x1e 0x01 0x01 0x0c 0x64 0x66 0x72 0x6f 0x62 0x6f 0x74 0x47 0x75 0x65 0x73 0x74 i
    return_msg = {}
    if mode == "write":
        IIC_writeCmd = f"i2cset -y {bus} {address} {command} i"
        res = execute_command(IIC_writeCmd)
        if res == "":
            return_msg = {'IIC_mode': 'write', 'status': True}
        else:
            return_msg = {'IIC_mode': 'write', 'status': False, 'debug_msg': res}
    elif mode == "read":
        # 从指定的寄存器地址读取一个字节
        # i2cget -y <bus_number> <device_address> <register_address>
        IIC_readCmd = f"i2cget -y {bus} {address} {command} " # 待测试
        res = execute_command(IIC_readCmd)
        return_msg = {'IIC_mode': 'read', 'message': res}
    return return_msg
  


# -----------------------------------------------------------------------------------------主逻辑函数
def main():
# 1、获取输入参数
    # eg. i2cset -y 2 0x16 0x1e 0x01 0x01 0x0c 0x64 0x66 0x72 0x6f 0x62 0x6f 0x74 0x47 0x75 0x65 0x73 0x74 i
    # eg. i2cset -y 2 0x16 0x1e 0x01 0x02 0x0b 0x64 0x66 0x72 0x6f 0x62 0x6f 0x74 0x32 0x30 0x32 0x30 i
    # eg. i2cset -y 2 0x16 0x1e 0x02 0x02 i

    parser = argparse.ArgumentParser(description='Python script with command line arguments')
    parser.add_argument('-bus', type=str, help='An string')    # eg. 2
    parser.add_argument('-address', type=str, help='An string')    # eg. 0x2c
    parser.add_argument('-mode', type=str, help='An string')    # eg. write/read
    parser.add_argument('-command', type=str, help='An string')     # eg. 0x1e ...
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

# 3、向板载IIC2端口发送数据
    response = IIC_communication(args.bus, args.address, args.mode, args.command)

# 4、将串口返回值通过MQTT发布出去
    topic = f"peripheral/iic/{args.uuid}"
    message = response
    client.publish(topic, json.dumps(message))
    print(topic, "      ", message)
    client.disconnect() # 断开连接


main()