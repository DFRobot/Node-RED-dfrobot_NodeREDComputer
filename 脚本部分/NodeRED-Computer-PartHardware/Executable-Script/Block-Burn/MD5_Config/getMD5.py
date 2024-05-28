# -*- coding: utf-8 -*-

import subprocess
import time
import ctypes

import json
import argparse


# 加载共享库（将md5.c文件打包为动态库供在python中使用）
libmd5 = ctypes.CDLL('/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/MD5_Config/libmd5.so')

# 假设你有一个函数 c_function() 定义在 md.c 中
# 需要先设置参数类型和返回类型，如果有的话
# libmd.c_function.argtypes = [ctypes.c_int, ctypes.c_char_p]
# libmd.c_function.restype = ctypes.c_void_p


'''
    获取MD5：传入sn，传出md5
'''
def Get_MD5(SN):
    # 函数原型声明
    # void MD5(const void* ps, char *output);   
    md5_func = libmd5.MD5
    md5_func.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_char)]
    md5_func.restype = None

    # 准备输入数据
    input_data = SN.encode("utf-8")
    # print('input_data = ', input_data)
    # input_data = b"761035777294CF52"
    output_buffer = ctypes.create_string_buffer(33)  # 假设输出是32字符的MD5散列加上空终止符
    
    # print('output_buffer = ', output_buffer)
    # 调用MD5函数
    md5_func(input_data, output_buffer)

    # 获取结果
    md5_value_hex = output_buffer.value.decode('ascii') # MD5值通常以16进制字符码的形式展示

    # print('md5_value_hex = ', md5_value_hex)
    return md5_value_hex


# -----------------------------------------------------------------------------------------主逻辑函数
def main():
# 1、获取输入参数
    parser = argparse.ArgumentParser(description='Python script with command line arguments')

    parser.add_argument('-sn', type=str, help='An string')

    args = parser.parse_args()
    
    res = Get_MD5(args.sn)
    print(res)



main()