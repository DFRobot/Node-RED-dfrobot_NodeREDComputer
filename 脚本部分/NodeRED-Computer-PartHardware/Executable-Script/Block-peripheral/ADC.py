# -*- coding: utf-8 -*-

import time
import argparse

def GPIO_ADC(Pin):
    # 组装路径
    file_path = f"/sys/bus/iio/devices/iio:device0/in_voltage{Pin}_raw"
    with open(file_path, 'r') as file:
        content = file.read()
        Real_voltage = int(content) * (3.3 / 960)
        print(Real_voltage)


# -----------------------------------------------------------------------------------------主要逻辑实现
try:
    # 创建参数解析器
    parser = argparse.ArgumentParser(description='Python script with command line arguments')

    # 添加参数
    parser.add_argument('-Pin', type=int, help='An integer, Specify the pins')

    # 解析命令行参数
    args = parser.parse_args()

    GPIO_ADC(args.Pin)
    # print('true')
except:
    print('false')



