import subprocess
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


def rkdeveloptool_ld(client):
    # 定义命令
    cmd = ['rkdeveloptool', 'ld']

    # 使用Popen执行命令
    with subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True) as p:
        for line in p.stdout:
            # print(line, end='')  # 打印输出
            pattern = r"not found any devices!"
            if re.search(pattern, line):
                # 发布消息到指定主题
                topic = "gateway/burn/error"
                message = {'error': line}
                client.publish(topic, json.dumps(message))
            else:
                pass

    # 等待进程结束，获取退出代码
    return_code = p.wait()
    if return_code != 0:
        print(f"rkdeveloptool ld Command exited with return code {return_code}")
        return -1
    else:
        print("rkdeveloptool ld Command executed successfully")
        return 0




def rkdeveloptool_db(client):
    # 定义命令
    cmd = ['rkdeveloptool', 'db', '/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/RockChip_Firmware/rk3308_bs_loader_uart0_m0_emmc_port_support_sd_20220516.bin']

    # 使用Popen执行命令
    with subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True) as p:
        for line in p.stdout:
            # print(line, end='')  # 打印输出
            pattern = r"failed"
            if re.search(pattern, line):
                # 发布消息到指定主题
                topic = "gateway/burn/error"
                message = {'error': line}
                client.publish(topic, json.dumps(message))
            else:
                pass

    # 等待进程结束，获取退出代码
    return_code = p.wait()
    if return_code != 0:
        print(f"rkdeveloptool db Command exited with return code {return_code}")
        return -1
    else:
        print("rkdeveloptool db Command executed successfully")
        return 0



def rkdeveloptool_wl(client, firmware):
    # 定义命令
    cmd = ['rkdeveloptool', 'wl', '0', firmware]

    progress_NumStr = 0

    # 使用Popen执行命令
    with subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True) as p:
        for line in p.stdout:
            # print(line, end='')  # 打印输出
            pattern = r'[0-9]+%'
            matches = re.findall(pattern, line)
            if matches:
                # print("line中包含[0-9]%的形式")
                for match in matches:
                    if progress_NumStr != match:
                        progress_NumStr = match
                        # print(match)
                        # 发布消息到指定主题
                        topic = "gateway/burn/progress"
                        message = {'progress': match, 'dashboard_label': match}
                        client.publish(topic, json.dumps(message))
            else:
                # print("line中不包含[0-9]%的形式")
                # 发布消息到指定主题
                topic = "gateway/burn/error"
                message = {'error': line}
                client.publish(topic, json.dumps(message))

    # 等待进程结束，获取退出代码
    return_code = p.wait()
    if return_code != 0:
        print(f"rkdeveloptool wl Command exited with return code {return_code}")
        return -1
    else:
        print("rkdeveloptool wl Command executed successfully")
        return 0



def rkdeveloptool_rd(client):
    # 定义命令
    cmd = ['rkdeveloptool', 'rd']

    # 使用Popen执行命令
    with subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True) as p:
        for line in p.stdout:
            # print(line, end='')  # 打印输出
            # 发布消息到指定主题

            pattern = r"OK"
            if re.search(pattern, line):
                pass
            else:
                # 发布消息到指定主题
                topic = "gateway/burn/error"
                message = {'error': line}
                client.publish(topic, json.dumps(message))

    # 等待进程结束，获取退出代码
    return_code = p.wait()
    if return_code != 0:
        print(f"rkdeveloptool rd Command exited with return code {return_code}")
        return -1
    else:
        print("rkdeveloptool rd Command executed successfully")
        return 0



def main_RockChipBurn():
    # 1、获取输入参数
    parser = argparse.ArgumentParser(description='Python script with command line arguments')

    parser.add_argument('-chip', type=str, help='An string, Specify the RockChip')
    parser.add_argument('-firmware', type=str, help='An string, Specify the path, eg: /root/rk3308.img')

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
    if args.chip == 'RK3308BS' or args.chip == 'RK3308K':
        if rkdeveloptool_ld(client) == -1:
            client.disconnect()
            return
        if rkdeveloptool_db(client) == -1:
            client.disconnect()
            return
        time.sleep(1)
        if rkdeveloptool_wl(client, args.firmware) == -1:
            client.disconnect()
            return
        if rkdeveloptool_rd(client) == -1:
            client.disconnect()
            return

    
    client.disconnect() # 断开连接


main_RockChipBurn()