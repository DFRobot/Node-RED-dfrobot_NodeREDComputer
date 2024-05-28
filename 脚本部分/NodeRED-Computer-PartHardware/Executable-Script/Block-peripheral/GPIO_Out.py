# -*- coding: utf-8 -*-

import time
import argparse

def GPIO_Out(Pin, Level):
    # 组装路径
    direction_path = f"/sys/class/gpio/gpio{Pin}/direction"
    value_path = f"/sys/class/gpio/gpio{Pin}/value"
    # direction = out     value = Level
    with open(direction_path, 'w') as f:
        f.write('out\n')
        time.sleep(0.1)
    with open(value_path, 'w') as f:
        f.write(f'{Level}\n')
        time.sleep(0.1)


# -----------------------------------------------------------------------------------------主要逻辑实现
try:
    # 创建参数解析器
    parser = argparse.ArgumentParser(description='Python script with command line arguments')

    # 添加参数
    parser.add_argument('-Pin', type=int, help='An integer, Specify the pins')
    parser.add_argument('-Level', type=int, help='An integer, Specify the level')

    # 解析命令行参数
    args = parser.parse_args()

    GPIO_Out(args.Pin, args.Level)
    print('true')
except:
    print('false')



