# -*- coding: utf-8 -*-

import time
import argparse
import select
import os

import paho.mqtt.client as mqtt
import uuid
import json

rising = "rising"
falling = "falling"
both = "both"
client = None  # 全局变量
# 这里的Interrupt用于选择边沿触发方式，Mode用于选择上下拉电阻（暂未实现，需要暴露新的接口出来?）
def GPIO_In_Trigger_Interrupt(Pin, Mode, Interrupt, arg_uuid):
    global client
    # 组装路径
    direction_path = f"/sys/class/gpio/gpio{Pin}/direction"
    value_path = f"/sys/class/gpio/gpio{Pin}/value"
    edge_path = f"/sys/class/gpio/gpio{Pin}/edge"

    # 设置中断模式  direction = in     edge = Interrupt
    with open(direction_path, 'w') as f:
        f.write('in\n')
        time.sleep(0.1)
    with open(edge_path, 'w') as f:
        if Interrupt == rising:
            f.write('rising\n')
        elif Interrupt == falling:
            f.write('falling\n')
        elif Interrupt == both:
            f.write('both\n')
        time.sleep(0.1)

    # 进行中断监听
    gpio_file = open(value_path, 'r')# 打开GPIO设备的value文件
    poll = select.poll()    # 使用poll来等待文件变化
    poll.register(gpio_file, select.POLLPRI)
    topic = f"gpio/interrupt/{arg_uuid}"
    print("topic = ", topic)
    try:
        while True:
            # 等待至少一个事件 
            events = poll.poll()
            for event in events:
                # 100ms消抖
                time.sleep(0.1)
                # 读取value文件以获取当前值
                gpio_file.seek(0)  # 移动到文件开头以确保能正确读取
                value = gpio_file.read().strip()
                # 当GPIO从低电平变为高电平时
                if Interrupt == rising:
                    if value == '1':
                        print("The rising edge is triggered")
                        # 发布消息
                        message = {'pin': f'{Pin}', 'trigger_type': 'rising_edge', 'level_change':"0->1"}
                        client.publish(topic, json.dumps(message))
                elif Interrupt == falling:
                    if value == '0':
                        print("The falling edge is triggered")
                        # 发布消息
                        message = {'pin': f'{Pin}', 'trigger_type': 'falling_edge', 'level_change':"1->0"}
                        client.publish(topic, json.dumps(message))
                elif Interrupt == both:
                    if value == '0':
                        print("The both edge is triggered")
                        # 发布消息
                        message = {'pin': f'{Pin}', 'trigger_type': 'both_edge',  'level_change':"1->0"}
                        client.publish(topic, json.dumps(message))
                    if value == '1':
                        print("The both edge is triggered")
                        # 发布消息
                        message = {'pin': f'{Pin}', 'trigger_type': 'both_edge', 'level_change':"0->1"}
                        client.publish(topic, json.dumps(message))
    finally:    
        gpio_file.close()




# MQTT 发布回调
def on_publish(client, userdata, result):
    print(f"Data published to topic gpio/interrupt/uuid")
    pass


# -----------------------------------------------------------------------------------------主要逻辑实现
try:
    # 生成一个唯一的客户端ID
    client_id = f"python_mqtt_{uuid.uuid4()}"

    # MQTT服务器设置（根据你的MQTT broker设置进行修改）
    mqtt_broker = "localhost"
    mqtt_port = 1883  # 通常是1883端口，除非你的broker使用了其他端口


    # 创建 MQTT 客户端实例，启用持久会话
    client = mqtt.Client(client_id=client_id, clean_session=False)

    # 指定发布消息的回调函数
    client.on_publish = on_publish

    # 连接到MQTT Broker
    client.connect(mqtt_broker, mqtt_port, keepalive=60)

    # 创建参数解析器
    parser = argparse.ArgumentParser(description='Python script with command line arguments')

    # 添加参数
    parser.add_argument('-Pin', type=int, help='An integer, Specify the pins')
    parser.add_argument('-Mode', type=str, help='An string, Specify the Mode')
    parser.add_argument('-Interrupt', type=str, help='An string, Specify the Interrupt')
    parser.add_argument('-uuid', type=str, help='An string')

    

    # 解析命令行参数
    args = parser.parse_args()

    print(args.uuid)

    GPIO_In_Trigger_Interrupt(args.Pin, args.Mode, args.Interrupt, args.uuid)


    # 断开连接
    client.disconnect()

except:
    print('false')



