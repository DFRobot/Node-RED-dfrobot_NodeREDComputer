# -*- coding: utf-8 -*-

import time
import argparse

def GPIO_ADC(Pin):
    # ��װ·��
    file_path = f"/sys/bus/iio/devices/iio:device0/in_voltage{Pin}_raw"
    with open(file_path, 'r') as file:
        content = file.read()
        Real_voltage = int(content) * (3.3 / 960)
        print(Real_voltage)


# -----------------------------------------------------------------------------------------��Ҫ�߼�ʵ��
try:
    # ��������������
    parser = argparse.ArgumentParser(description='Python script with command line arguments')

    # ��Ӳ���
    parser.add_argument('-Pin', type=int, help='An integer, Specify the pins')

    # ���������в���
    args = parser.parse_args()

    GPIO_ADC(args.Pin)
    # print('true')
except:
    print('false')



