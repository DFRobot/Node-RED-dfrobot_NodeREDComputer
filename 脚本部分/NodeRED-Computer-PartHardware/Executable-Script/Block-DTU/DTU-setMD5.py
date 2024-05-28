# -*- coding: utf-8 -*-

import subprocess
import time
import serial
import ctypes
import re

import json
import time
import argparse

libmd5 = ctypes.CDLL('../DTU-MD5/libmd5.so')

'''
    打开串口
    返回值：串口打开成功——>返回串口对象      串口打开失败——>-1
'''
def Open_Serial_Port(port='/dev/ttyACM0', baudrate=115200, timeout=1):
    print('port = ', port)
    try:
        ser = serial.Serial(port, baudrate, timeout=timeout)
        # print("Serial Open")
        return ser
    except serial.SerialException as e:
        # print(f"Serial Open error: {e}")
        return -1

'''
    发送AT命令并打印返回内容
    返回值：1、AT返回值(可能为空)   2、发送AT出错
'''
def Send_AT_Command(ser, AT_command):
    if ser is not -1 and ser.isOpen():
        try:
            ser.write(AT_command.encode())  # 发送AT命令
            time.sleep(0.5)  # 等待AT返回值
            response = ser.read_all()  # 读取返回的内容
            # print("response: ", response.decode())      # REN-调试（后期注释）
            return response.decode()
        except serial.SerialException as e:
            # print(f"Send AT error: {e}")   # REN-调试（后期注释）
            return -1

'''
    关闭串口  
'''
def Close_Serial_Port(ser):
    if ser is not -1 and ser.isOpen():
        ser.close()
        # print("Serial Close")   # REN-调试（后期注释）


'''
    通过串口发送AT指令获取产品序列号SN
    返回值：SN 或 None
    特殊情况：1、打不开/dev/ttyACM0串口    2、获取不到AT+SN?\r\n的返回值或为空
'''
def AT_Get_SN(devname):
    serial_obj = 0
    for i in range(10):  # 最多循环10次(5s)尝试打开/dev/ttyACM0 （一般来说打开串口失败是未找到/dev/ttyACM0设备）
        serial_obj = Open_Serial_Port(port=devname)
        if serial_obj == -1:
            time.sleep(0.5)
            continue
        else:
            time.sleep(0.5)
            DTU_SN = None
            for i in range(10):
                response = Send_AT_Command(serial_obj, 'AT+SN?\r\n') 
                if "+SN=" in response:
                    sn_index = response.index("+SN=") + 4
                    DTU_SN = response[sn_index:].strip()
                    Close_Serial_Port(serial_obj)
                    return DTU_SN
                else:
                    continue
            Close_Serial_Port(serial_obj)
            return DTU_SN


'''
    设置MD5
    返回值：False/True
'''
def AT_Set_MD5(devname, DTU_SN):

    md5_func = libmd5.MD5
    md5_func.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_char)]
    md5_func.restype = None
    input_data = DTU_SN.encode("utf-8")
    output_buffer = ctypes.create_string_buffer(33) 
    md5_func(input_data, output_buffer)
    md5_value_hex = output_buffer.value.decode('ascii')
    serial_obj = 0
    for i in range(10): 
        serial_obj = Open_Serial_Port(port=devname)
        if serial_obj == -1:
            time.sleep(0.5)
            continue
        else:   
            time.sleep(0.5)
            setMD5_status = False
            for i in range(10):
                response = Send_AT_Command(serial_obj, f'AT+MD5={md5_value_hex}\r\n') 
                if "OK" in response:
                    setMD5_status = True
                    Close_Serial_Port(serial_obj)
                    return setMD5_status
                else:
                    continue
            Close_Serial_Port(serial_obj)
            return setMD5_status




# -----------------------------------------------------------------------------------------主逻辑函数
def main():

    parser = argparse.ArgumentParser(description='Python script with command line arguments')
    parser.add_argument('-device_name', type=str, help='An string, Specify the device name')
    args = parser.parse_args()

    sn = AT_Get_SN(args.device_name)
    print('sn = ',sn)
    pattern = r"[0-9a-zA-Z]{16}"
    if sn != None and re.match(pattern, sn): 
        md5_status = AT_Set_MD5(args.device_name, sn)
        print('md5_status = ',md5_status)
        message = {'set_md5': md5_status, 'dashboard_label': '写入成功'}
        print("Info: 写入md5成功!")
    else:
        print("Info: 获取sn失败，致使写入md5失败!")

main()