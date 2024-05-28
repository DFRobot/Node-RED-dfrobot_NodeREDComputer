import subprocess
import re
import paho.mqtt.client as mqtt
import uuid
import json
import time
import argparse
import configparser
import time


# 连接成功回调函数
def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))

# 发布消息回调函数
def on_publish(client, userdata, mid):
    print("Message published")






# IsAfterDownRest = 0/1
def setConfigFile(IsAfterDownRest):
    # 读取配置文件并保持大小写
    config = configparser.RawConfigParser()
    config.optionxform = str  # 保持大小写
    config.read('/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/CH58x_Firmware/Config.ini.backup')
    if IsAfterDownRest == 'true':
        config.set('CH57x-58xUICfg', 'IsAfterDownRest', '1')
    else:
        config.set('CH57x-58xUICfg', 'IsAfterDownRest', '0')
    # 保存修改后的配置文件并保持大小写
    with open('/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/CH58x_Firmware/Config.ini', 'w') as configfile:
        config.write(configfile)






def CH58x_burn(client, device_name, firmware_codeflash, firmware_dataflash):
    command1 = [
        '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/CH58x_Firmware/WCHISPTool_CMD_REN',
        '-p', device_name,
        '-c', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/CH58x_Firmware/Config.ini',
        '-o', 'program',
        '-f', firmware_codeflash
    ]
    command2 = [
        '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/CH58x_Firmware/WCHISPTool_CMD_REN',
        '-p', device_name,
        '-c', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/CH58x_Firmware/Config.ini',
        '-o', 'program',
        '-f', firmware_codeflash,
        '-d', firmware_dataflash
    ]

    if firmware_dataflash == 'none':
        # 使用Popen执行命令
        with subprocess.Popen(command1, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True) as p:
            topic = "ch58x/burn"
            message = {'result': False, 'device_name': device_name, 'burn_codeflash': False}
            for line in p.stdout:
                # print(line, end='')  # 打印输出
                pattern = r"Finished"
                if re.search(pattern, line):
                    message["result"] = True
                    message["burn_codeflash"] = True
            client.publish(topic, json.dumps(message))
        # 等待进程结束，获取退出代码
        return_code = p.wait()
        if return_code != 0:
            print(f"Command exited with return code {return_code}")
            return -1
        else:
            print("Command executed successfully")
            return 0
    else:
        with subprocess.Popen(command2, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True) as p:
            message = {'result': False, 'device_name': device_name, 'burn_codeflash': False, 'burn_dataflash': False}
            for line in p.stdout:
                # print('Line = ', line, end='')  # 打印输出
                pattern1 = r"write dataflash succeed"
                pattern2 = r"Finished"
                if re.search(pattern1, line):
                    message['burn_codeflash'] = True
                if re.search(pattern2, line):
                    message['burn_dataflash'] = True
                if message['burn_codeflash'] == True and message['burn_dataflash'] == True:
                    message['result'] = True
                    message['dashboard_label'] = '烧录成功'
            topic = "ch58x/burn"
            # print(message)
            client.publish(topic, json.dumps(message))
        # 等待进程结束，获取退出代码
        return_code = p.wait()
        if return_code != 0:
            print(f"Command exited with return code {return_code}")
            return -1
        else:
            print("Command executed successfully")
            return 0


def main():
    # 1、获取输入参数
    parser = argparse.ArgumentParser(description='Python script with command line arguments')

    parser.add_argument('-chip', type=str, help='An string, Specify the Chip')
    parser.add_argument('-device_name', type=str, help='An string, Specify the device name')
    parser.add_argument('-firmware_codeflash', type=str, help='An string, Specify the path')
    parser.add_argument('-firmware_dataflash', type=str, help='An string, Specify the path')
    parser.add_argument('-IsAfterDownRest', type=str, help='An string, Specify the path')

    args = parser.parse_args()
    

    # 2、MQTT配置
    client_id = f"python_mqtt_{uuid.uuid4()}"   # 生成一个唯一的客户端ID

    mqtt_broker = "localhost"   # MQTT服务器设置
    mqtt_port = 1883

    client = mqtt.Client(client_id=client_id, clean_session=False)  # 创建 MQTT 客户端实例，启用持久会话

    client.on_connect = on_connect    # 设置连接回调函数
    client.on_publish = on_publish    # 指定发布消息的回调函数

    client.connect(mqtt_broker, mqtt_port, keepalive=60)    # 连接到MQTT Broker(代理服务器)


    # 3、烧录RockChip
    if args.chip == 'ch583':
        setConfigFile(args.IsAfterDownRest)
        time.sleep(0.5)
        CH58x_burn(client, args.device_name, args.firmware_codeflash, args.firmware_dataflash)
        
    
    client.disconnect() # 断开连接


main()