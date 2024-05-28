# -*- coding: utf-8 -*-

import subprocess
import argparse
import time
import paho.mqtt.client as mqtt
import uuid
import json


def ESP32_Burn(device_name, chip, firmware):
    # 1、esp32（DFRobt-esp32-e/esp32-eu）
    if chip == 'esp32e': 
        print(device_name, chip, firmware)
        command_esp32 = [
            'esptool.py',
            '--chip', 'esp32',
            '--port', device_name,
            '--baud', '921600',
            '--before', 'default_reset',
            '--after', 'hard_reset',
            'write_flash',
            '-z',
            '--flash_mode', 'dio',
            '--flash_freq', '80m',
            '--flash_size', '4MB',
            '0x1000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32e/esp32e.bootloader.bin',
            '0x8000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32e/esp32e.partitions.bin',
            '0xe000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32e/esp32e.boot_app0.bin',
            '0x10000', firmware
            # '0x10000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32e/esp32e.Blink.bin'
        ]
        Burn_Result = {'device_name': device_name, 'write_flash': False, 'status': "False"}
        try:
            result = subprocess.run(command_esp32, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, check=True)
            Burn_Result['write_flash'] = True
            Burn_Result['status'] = 'True'
        except subprocess.CalledProcessError as e:
            Burn_Result['write_flash'] = False

    # 1_patch1、esp32（TEL0126）
    if chip == 'TEL0126': 
        print(device_name, chip, firmware)
        command_TEL0126 = [
            'esptool.py',
            '--chip', 'esp32',
            '--port', device_name,
            '--baud', '921600',
            '--before', 'default_reset',
            '--after', 'hard_reset',
            'write_flash',
            '-z',
            '--flash_mode', 'dio',
            '--flash_freq', '80m',
            '--flash_size', '4MB',
            '0x1000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/TEL0126/TEL0126_bootloader.bin',
            '0x8000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/TEL0126/TEL0126_partition-table.bin',
            '0x10000', firmware,
            '0xd000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/TEL0126/TEL0126_ota_data_initial.bin'
        ]
        Burn_Result = {'device_name': device_name, 'write_flash': False, 'status': "False"}
        try:
            result = subprocess.run(command_TEL0126, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, check=True)
            Burn_Result['write_flash'] = True
            Burn_Result['status'] = 'True'
        except subprocess.CalledProcessError as e:
            Burn_Result['write_flash'] = False


    # 2、esp8266（DFRobt-esp8266）
    if chip == 'esp8266': 
        print(device_name, chip, firmware)
        command_esp8266 = [
            'esptool.py',
            '--chip', 'esp8266',
            '--port', device_name,
            '--baud', '921600',
            '--before', 'default_reset',
            # '--after', 'hard_reset',
            '--after', 'soft_reset',
            'write_flash',
            '-z',
            '--flash_mode', 'dio',
            '--flash_freq', '80m',
            '--flash_size', '4MB',
            '0x0', firmware
            # '0x0', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp8266/esp8266-Blink.bin'
        ]
        Burn_Result = {'device_name': device_name, 'write_flash': False, 'status': "False"}
        try:
            result = subprocess.run(command_esp8266, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, check=True)
            Burn_Result['write_flash'] = True
            Burn_Result['status'] = 'True'
        except subprocess.CalledProcessError as e:
            Burn_Result['write_flash'] = False
            
    # 3、esp32s3（DFRobt-esp32-s3）
    elif chip == 'esp32s3': 
        print(device_name, chip, firmware)
        command_esp32s3 = [
            'esptool.py',
            '--chip', 'esp32s3',
            '--port', device_name,
            '--baud', '921600',
            '--before', 'default_reset',
            '--after', 'hard_reset',
            'write_flash',
            '-z',
            '--flash_mode', 'dio',
            '--flash_freq', '80m',
            '--flash_size', '4MB',
            '0x0', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32s3/esp32s3-bootloader.bin',
            '0x8000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32s3/esp32s3-partitions.bin',
            '0xe000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32s3/esp32s3-boot_app0.bin',
            '0x10000', firmware
            # '0x10000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32s3/esp32s3-Blink.bin'
        ]
        Burn_Result = {'device_name': device_name, 'write_flash': False, 'status': "False"}
        try:
            result = subprocess.run(command_esp32s3, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, check=True)
            Burn_Result['write_flash'] = True
            Burn_Result['status'] = 'True'
        except subprocess.CalledProcessError as e:
            Burn_Result['write_flash'] = False
            
    # 4、esp32c3（DFRobt-esp32-c3）
    elif chip == 'esp32c3': 
        print(device_name, chip, firmware)
        command_esp32c3 = [
            'esptool.py',
            '--chip', 'esp32c3',
            '--port', device_name,
            '--baud', '921600',
            '--before', 'default_reset',
            '--after', 'hard_reset',
            'write_flash',
            '-z',
            '--flash_mode', 'dio',
            '--flash_freq', '80m',
            '--flash_size', '4MB',
            '0x0', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32c3/esp32c3-bootloader.bin',
            '0x8000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32c3/esp32c3-partitions.bin',
            '0xe000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32c3/esp32c3-boot_app0.bin',
            '0x10000', firmware
            # '0x10000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32c3/esp32c3-Blink.bin'
        ]
        Burn_Result = {'device_name': device_name, 'write_flash': False, 'status': "False"}
        try:
            result = subprocess.run(command_esp32c3, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, check=True)
            Burn_Result['write_flash'] = True
            Burn_Result['status'] = 'True'
        except subprocess.CalledProcessError as e:
            Burn_Result['write_flash'] = False

    # 5、esp32c6
    elif chip == 'esp32c6': 
        command_eraseFlash = [
            'esptool.py',
            '--chip', chip,
            '--port', device_name,
            '--baud', '921600',
            '--before', 'default_reset',
            '--after', 'hard_reset',
            'erase_flash'
        ]
        command_esp32c6 = [
            'esptool.py',
            '--chip', chip,
            '--port', device_name,
            '--baud', '921600',
            '--before', 'default_reset',
            '--after', 'hard_reset',
            'write_flash',
            '-z',
            '--flash_mode', 'keep',
            '--flash_freq', 'keep',
            '--flash_size', 'keep',
            '0x0', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32c6/esp32c6-bootloader.bin',
            '0x8000', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Firmware/esp32c6/esp32c6-partitions.bin',
            '0x10000', firmware
        ]
        Burn_Result = {'device_name': device_name, 'write_flash': False, 'status': "False"}
        try:
            result = subprocess.run(command_esp32c6, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, check=True)
            Burn_Result['write_flash'] = True
            Burn_Result['status'] = 'True'

        except subprocess.CalledProcessError as e:
            Burn_Result['write_flash'] = False


    print(Burn_Result) # 用于调试，可有可无
    return Burn_Result


def on_publish(client, userdata, result):
    print(f"Data published to topic esp32/burn_result")
    pass



try:
    if True:
        client_id = f"python_mqtt_{uuid.uuid4()}"

        mqtt_broker = "localhost"
        mqtt_port = 1883

        client = mqtt.Client(client_id=client_id, clean_session=False)

        client.on_publish = on_publish

        client.connect(mqtt_broker, mqtt_port, keepalive=60)


        parser = argparse.ArgumentParser(description='Python script with command line arguments')

        parser.add_argument('-device_name', type=str, help='An string, Specify the /devttyACMx')
        parser.add_argument('-chip', type=str, help='An string, Specify the esp32c6')
        parser.add_argument('-firmware', type=str, help='An string, Specify the /root/blink.bin')

        args = parser.parse_args()
        

        message = ESP32_Burn(args.device_name, args.chip, args.firmware)
        json_data = json.dumps(message)

        topic = "esp32/burn_result"
        client.publish(topic, json_data)

        client.disconnect()

except:
   print('false')