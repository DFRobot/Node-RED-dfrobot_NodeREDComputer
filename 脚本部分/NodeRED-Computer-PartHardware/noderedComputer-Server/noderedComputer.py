# -*- coding: utf-8 -*-

from flask import Flask, jsonify, request
import json
import threading
from threading import Thread
import subprocess
import redis



# -------------------------------------------------------------------------------------------服务器启动前的其他准备工作（开启事件监听进程）
def run_external_binary_deviceMonitor():
    try:
        subprocess.Popen(["/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Common/deviceMonitor"], shell=True)   # shell=True表示可以直接在命令中使用命令行语法，如果命令是来自不可信的来源，可能会导致命令注入等安全问题
    except:
        pass

def run_external_binary_pyGame():
    try:
        subprocess.Popen(["python3 /root/NodeRED-Computer-PartHardware/Executable-Script/Block-pyGame-lcdWidget/drawLcdWidget.py"], shell=True)   
    except:
        pass


def run_external_binary_InitGPIO():
    try:
        subprocess.Popen(["/root/NodeRED-Computer-PartHardware/EnvironmentSetup/peripheralConfig/gpio_pin_init.sh"], shell=True)   
    except:
        pass
    

# -------------------------------------------------------------------------------------------一些全局变量的定义（便于后期移植与维护）
RK3308BoardV1_0_GPIO_PinList = ['80', '79', '76', '75', '74', '72', '70', '32', '40', '10', '16', '18', '17', '21', '7', '6', '5', '1']
RK3308BoardV1_0_ADC_PinList = [0, 2, 3, 4, 5]
RK3308BoardV1_0_DAC_PinList = [0, 1, 2, 3, 4, 5, 6, 7]

# -------------------------------------------------------------------------------------------路由处理
app = Flask(__name__)

@app.route('/', methods=['GET'])
def hello():
    return 'Hello, World!'


# GPIO-Out的路由
@app.route('/peripheral/gpio/out', methods=['POST'])
def control_gpio_out():
    pin = None
    level = None
    try:
        data = request.get_json(force=True)  # 强制解析JSON数据，如果解析错误会抛出BadRequest异常
        pin = data.get('Pin')
        level = data.get('Level')
    except:
        return jsonify({"result": False, "error_msg": "请求出错, 无效的JSON数据"}), 200

    if pin in RK3308BoardV1_0_GPIO_PinList and level in [0, 1]: # 验证数据
        try:
            command = f"python3 /root/NodeRED-Computer-PartHardware/Executable-Script/Block-peripheral/GPIO_Out.py -Pin {pin} -Level {level}"
            result = subprocess.check_output(command, shell=True)
            output = result.decode('utf-8').strip() # 将脚本输出转换为字符串
            if output == 'false':
                return jsonify({"result": False, "error_msg": "脚本执行出错"}), 200
            else:
                return jsonify({"result": True}), 200
        except subprocess.CalledProcessError as e:
            return jsonify({"result": False, "error_msg": str(e)}), 200
    else:
        if pin not in RK3308BoardV1_0_GPIO_PinList and level not in [0, 1]:
            return jsonify({"result": False, "error_msg": "引脚编号错误, 输入电平错误"}), 200
        elif level not in [0, 1]:
            return jsonify({"result": False, "error_msg": "输入电平错误"}), 200
        elif pin not in RK3308BoardV1_0_GPIO_PinList:
            return jsonify({"result": False, "error_msg": "引脚编号错误"}), 200



# GPIO-In的路由
@app.route('/peripheral/gpio/in', methods=['POST'])
def control_gpio_in():
    pin = None
    try:
        data = request.get_json(force=True)  # 强制解析JSON数据，如果解析错误会抛出BadRequest异常
        pin = data.get('Pin')
    except:
        # 处理非 JSON 数据的情况
        return jsonify({"result": False, "error_msg": "请求出错, 无效的JSON数据"}), 200

    # 验证数据
    if pin in RK3308BoardV1_0_GPIO_PinList :
        # 数据验证通过，执行外部脚本
        try:
            # 构建命令行命令
            command = f"python3 /root/NodeRED-Computer-PartHardware/Executable-Script/Block-peripheral/GPIO_In.py -Pin {pin}"
            # 调用外部脚本并捕获输出
            result = subprocess.check_output(command, shell=True)
            # 将脚本输出转换为字符串
            output = result.decode('utf-8').strip()
            # print('GPIO-In = ', output)
            if output == 'false':
                return jsonify({"result": False, "pin": pin, "error_msg": "脚本执行出错"}), 200
            else:
                return jsonify({"result": True, "pin": pin, "value": output}), 200
        except subprocess.CalledProcessError as e:
            return jsonify({"result": False, "error_msg": str(e)}), 200
    else:
        return jsonify({"result": False, "pin": pin, "error_msg": "引脚编号超出范围"}), 200




# ADC的路由
@app.route('/peripheral/adc', methods=['POST'])
def control_adc():
    pin = None
    try:
        data = request.get_json(force=True)  
        pin = data.get('Pin')
    except:
        # 处理非 JSON 数据的情况
        return jsonify({"result": False, "error_msg": "请求出错, 无效的JSON数据"}), 200

    # 验证数据
    if isinstance(pin, int) and pin in RK3308BoardV1_0_ADC_PinList:
        # 数据验证通过，执行外部脚本
        try:
            # 构建命令行命令
            command = f"python3 /root/NodeRED-Computer-PartHardware/Executable-Script/Block-peripheral/ADC.py -Pin {pin}"
            # 调用外部脚本并捕获输出
            result = subprocess.check_output(command, shell=True)
            # 将脚本输出转换为字符串
            output = result.decode('utf-8').strip()
            if output == 'false':
                return jsonify({"result": False, "pin": f"ADC{pin}", "error_msg": "脚本执行出错"}), 200
            else:
                return jsonify({"result": True, "pin": f"ADC{pin}", "voltage": output}), 200
        except subprocess.CalledProcessError as e:
            return jsonify({"result": False, "error_msg": str(e)}), 200
    else:
        return jsonify({"result": False, "pin": f"ADC{pin}", "error_msg": "引脚错误,超出范围"}), 200


# DAC的路由
@app.route('/peripheral/dac', methods=['POST'])
def control_dac():
    pin = None
    voltage = None
    try:
        data = request.get_json(force=True)  # 强制解析JSON数据，如果解析错误会抛出BadRequest异常
        pin = data.get('Pin')
        voltage = data.get('Voltage')
    except:
        # 处理非 JSON 数据的情况
        return jsonify({"result": False, "error_msg": "请求出错, 无效的JSON数据"}), 200

    # 验证数据
    if isinstance(pin, int) and pin in RK3308BoardV1_0_DAC_PinList and 0 <= voltage <= 3.3:
        # 数据验证通过，执行外部脚本
        try:
            # 构建命令行命令
            command = f"python3 /root/NodeRED-Computer-PartHardware/Executable-Script/Block-peripheral/DAC.py -Pin {pin} -Level {voltage}"
            # 调用外部脚本并捕获输出
            result = subprocess.check_output(command, shell=True)
            # 将脚本输出转换为字符串
            output = result.decode('utf-8').strip()
            if output == 'false':
                return jsonify({"result": False, "error_msg": "脚本执行出错"}), 200
            else:
                return jsonify({"result": True}), 200
        except subprocess.CalledProcessError as e:
            return jsonify({"result": False, "error_msg": str(e)}), 200
    else:
        return jsonify({"result": False, "error_msg": "引脚错误或电压超出有效范围"}), 200



@app.route('/serial/communication', methods=['post'])
def serial_communication():
    port = None
    baudrate = None
    responseTime = None
    cmd = None
    endMark = None
    uuid = None
    try:
        data = request.get_json(force=True)  # 强制解析JSON数据，如果解析错误会抛出BadRequest异常
        port = data.get('port')
        baudrate = data.get('baudrate')
        responseTime = data.get('responseTime')
        cmd = data.get('cmd')
        endMark = data.get('endMark')
        uuid = data.get('uuid')
        # 构建命令行命令
        command = f'python3 /root/NodeRED-Computer-PartHardware/Executable-Script/Block-peripheral/serialEvent.py -port "{port}" -baudrate "{baudrate}" -responseTime "{responseTime}" -uuid "{uuid}" -cmd "{cmd}" -endMark "{endMark}"'   
        print(command) 
        subprocess.Popen(command, shell=True)   # 执行外部脚本，不等待完成
        return jsonify({"result": True}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"result": False, "error_msg": str(e)}), 200




@app.route('/peripheral/iic', methods=['post'])
def control_iic():
    bus = None
    address = None
    mode = None
    command = None
    uuid = None
    try:
        data = request.get_json(force=True)  # 强制解析JSON数据，如果解析错误会抛出BadRequest异常
        bus = data.get('bus')
        address = data.get('address')
        mode = data.get('mode')
        command = data.get('command')
        uuid = data.get('uuid')
        # 构建命令行命令
        command = f'python3 /root/NodeRED-Computer-PartHardware/Executable-Script/Block-peripheral/IIC.py -bus "{bus}" -address "{address}" -mode "{mode}" -command "{command}" -uuid "{uuid}"'   
        print(command) 
        subprocess.Popen(command, shell=True)   # 执行外部脚本，不等待完成
        return jsonify({"result": True}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"result": False, "error_msg": str(e)}), 200





# ESP32烧录的路由（烧录成功与否通过mqtt转发即可）
def esp32Burn_Callback(device_name, chip, firmware):
    # 默认ESP32芯片型号-C6

    # 构建命令行命令
    command = f"python3 /root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/ESP32_Burn.py -device_name {device_name} -chip {chip} -firmware {firmware}"
    print(command)
    subprocess.Popen(command, shell=True)

@app.route('/esp32/burn', methods=['POST'])
def burn_esp32():
    device_name = None
    firmware = None
    chip = None
    try:
        data = request.get_json(force=True)  # 强制解析JSON数据，如果解析错误会抛出BadRequest异常
        device_name = data.get('device_name')
        chip = data.get('chip')
        firmware = data.get('firmware')
    except:
        # 处理非 JSON 数据的情况
        return jsonify({"result": False, "error_msg": "请求出错, 无效的JSON数据"}), 200

    thread = Thread(target=esp32Burn_Callback,  args=(device_name, chip, firmware))
    thread.start()
    return jsonify({"result": True, 'message': { 'device_name': device_name, 'status': 'Burning'}}), 200



@app.route('/ch58x/burn', methods=['post'])
def ch58x_burn():
    chip = None
    device_name = None
    firmware_codeflash = None
    firmware_dataflash = None
    IsAfterDownRest = None
    try:
        data = request.get_json(force=True)  # 强制解析JSON数据，如果解析错误会抛出BadRequest异常
        chip = data.get('chip')
        device_name = data.get('device_name')
        firmware_codeflash = data.get('firmware_codeflash')
        firmware_dataflash = data.get('firmware_dataflash')
        IsAfterDownRest = data.get('IsAfterDownRest')
        # 构建命令行命令
        command = f"python3 /root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/WCHISP_Burn.py -chip {chip} -device_name {device_name} -firmware_codeflash {firmware_codeflash} -firmware_dataflash {firmware_dataflash} -IsAfterDownRest {IsAfterDownRest}"    
        subprocess.Popen(command, shell=True)   # 执行外部脚本，不等待完成
        return jsonify({"result": True, 'message': { 'device_name': device_name, 'status': 'Burning'}}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"result": False, "error_msg": str(e)}), 200





# Rockchip烧录的路由（烧录成功与否通过mqtt转发即可）
def RockChipBurn_Callback(chip, firmware):
    # 默认ESP32芯片型号-C6

    # 构建命令行命令
    command = f"python3 /root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/RockChip_Burn.py  -chip {chip} -firmware {firmware}"
    # print(command)
    subprocess.Popen(command, shell=True)


@app.route('/rockchip/burn', methods=['POST'])
def burn_rockchip():
    chip = None
    firmware = None
    try:
        data = request.get_json(force=True)  # 强制解析JSON数据，如果解析错误会抛出BadRequest异常
        chip = data.get('chip')
        firmware = data.get('firmware')
    except:
        # 处理非 JSON 数据的情况
        return jsonify({"result": False, "error_msg": "请求出错, 无效的JSON数据"}), 200

    thread = Thread(target=RockChipBurn_Callback,  args=(chip, firmware))
    thread.start()
    return jsonify({"result": True}), 200






@app.route('/dtu/at/dtu_config', methods=['post'])
def dtu_at_dtu_config():
    devname = None
    atType = None
    config1 = None
    config2 = None
    config3 = None
    region = None
    try:
        data = request.get_json(force=True)  # 强制解析JSON数据，如果解析错误会抛出BadRequest异常
        devname = data.get('devname')
        atType = data.get('atType')
        config1 = data.get('config1')
        config2 = data.get('config2')
        config3 = data.get('config3')
        region = data.get('region')
        # 构建命令行命令
        command = f"python3 /root/NodeRED-Computer-PartHardware/python-Script/DTU_AT.py -devname {devname} -atType {atType} -config1 {config1} -config2 {config2} -config3 {config3} -region {region}"    
        subprocess.Popen(command, shell=True)   # 执行外部脚本，不等待完成
        return jsonify({"result": True}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"result": False, "error_msg": str(e)}), 200




# 连接到本地Redis服务器
redis_conn = redis.Redis()

@app.route('/lcd/draw', methods=['POST'])
def draw_shape():
    print("request = ", request)
    data = request.json
    print("data = ", data)
    # 发布绘图命令
    redis_conn.publish('redis_draw_cmd', str(data))
    return jsonify({"status": "success", "data": data}), 200




if __name__ == '__main__':
    # 启动事件监听
    thread1 = threading.Thread(target=run_external_binary_deviceMonitor)   # 创建一个线程，将 run_external_script 函数作为目标
    thread1.start()

    thread2 = threading.Thread(target=run_external_binary_pyGame)   # 创建一个线程，将 run_external_script 函数作为目标
    thread2.start()

    run_external_binary_InitGPIO()

    # 启动服务器
    app.run(debug=False, port=5000, host='10.1.2.3')    # 如果debug=True，整个服务器会被运行两次








