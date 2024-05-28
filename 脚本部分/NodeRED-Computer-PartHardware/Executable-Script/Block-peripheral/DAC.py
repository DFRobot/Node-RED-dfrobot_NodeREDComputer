
# -*- coding: utf-8 -*-

import time
import argparse

def GPIO_DAC(Pin, Level):
    # 组装路径
    file_path = f"/sys/bus/iio/devices/iio:device1/out_voltage{Pin}_raw"

    raw = int((255*Level)/3.3)
    # print(raw)
    with open(file_path, 'w') as f:
        f.write(f'{raw}\n')
        time.sleep(0.1)



# -----------------------------------------------------------------------------------------主要逻辑实现
try:
    # 创建参数解析器
    parser = argparse.ArgumentParser(description='Python script with command line arguments')

    # 添加参数
    parser.add_argument('-Pin', type=int, help='An integer, Specify the pins')
    parser.add_argument('-Level', type=float, help='A floating-point number, Specify the level')


    # 解析命令行参数
    args = parser.parse_args()

    GPIO_DAC(args.Pin, args.Level)
    print('true')
except:
    print('false')



