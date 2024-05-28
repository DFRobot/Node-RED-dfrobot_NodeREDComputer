
# -*- coding: utf-8 -*-

import time
import argparse

def GPIO_DAC(Pin, Level):
    # ��װ·��
    file_path = f"/sys/bus/iio/devices/iio:device1/out_voltage{Pin}_raw"

    raw = int((255*Level)/3.3)
    # print(raw)
    with open(file_path, 'w') as f:
        f.write(f'{raw}\n')
        time.sleep(0.1)



# -----------------------------------------------------------------------------------------��Ҫ�߼�ʵ��
try:
    # ��������������
    parser = argparse.ArgumentParser(description='Python script with command line arguments')

    # ��Ӳ���
    parser.add_argument('-Pin', type=int, help='An integer, Specify the pins')
    parser.add_argument('-Level', type=float, help='A floating-point number, Specify the level')


    # ���������в���
    args = parser.parse_args()

    GPIO_DAC(args.Pin, args.Level)
    print('true')
except:
    print('false')



