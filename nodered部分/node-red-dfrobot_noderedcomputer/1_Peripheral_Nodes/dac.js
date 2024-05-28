
const axios = require('axios');

const request_url = "http://10.1.2.3:5000/peripheral/dac";


module.exports = function(RED) {

    function DAC_NodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.pin = config.pin;
        node.initVoltage = config.initVoltage;
        node.set = config.set

        let obj_paraStatus = {parameter_status: 0};     // 参数状态

/****************************************************************************************
 * 一、函数封装
 ****************************************************************************************/ 
        // 1、通用的HTTP请求函数
        function sendHttpRequest(method, url, payload, node, arg_obj) {
            const axiosConfig = {
                method: method,
                url: url,
                data: payload
            };
            axios(axiosConfig)
                .then(function (response) {
                    if (response.data.hasOwnProperty('result')) {
                        if (response.data.result == false) {
                            node.status({fill:"red",shape:"ring",text: response.data.error_msg});
                        }else{
                            node.status({fill: "green", shape: "ring", text: `DAC${arg_obj.arg_pin+1} 电压值:${arg_obj.arg_voltage}V`});
                            // node.status({fill: "green",shape: "ring",text: `DAC${temp_Pin+1}初始电压: ${temp_Voltage}V`});
                        }
                    }
                })
                .catch(function (error) {
                    node.status({fill:"red",shape:"ring",text: error});
                });
        }

            
/*****************************************************************************************
 * 二、部署时执行
 *****************************************************************************************/ 
        node.status({});  
        let arg_obj = {"arg_pin": "", "arg_voltage": ""}
        // 若勾选了引脚电平初始化
        if (node.set == true) {
            try {
                parseInt(node.pin)
                parseFloat(node.initVoltage)
            } catch (error) {
                node.status({fill:"red",shape:"ring",text: `输出电压初始值的格式错误`});
                obj_paraStatus.parameter_status = -1
            }

            let temp_Pin = parseInt(node.pin)
            let temp_Voltage = parseFloat(node.initVoltage)

            arg_obj["arg_pin"] = temp_Pin
            arg_obj["arg_voltage"] = temp_Voltage

            var postPayload = {
                Pin: parseInt(node.pin),
                Voltage: parseFloat(node.initVoltage)
            };

            if(obj_paraStatus.parameter_status == 0){
                sendHttpRequest('post', request_url, postPayload, node, arg_obj);
            }
        }
        
/*****************************************************************************************
 * 三、输入触发执行
 *****************************************************************************************/ 
        node.on('input', function(msg) {
            node.status({}); 
            obj_paraStatus.parameter_status = 0;
            if(msg.payload.hasOwnProperty('voltage')){
                if(typeof msg.payload.voltage === 'number'){
                    let payload = msg.payload.voltage;
                    if (payload < 0 || payload > 3.3) {
                        node.status({fill:"red",shape:"ring",text: `输入的msg.payload.voltage必须为: 数字0~3.3`});
                        node.error("输入的msg.payload.voltage必须为: 数字0~3.3");
                        return;
                    }
                }else{
                    node.status({fill:"red",shape:"ring",text: `输入的msg.payload.voltage必须为: 数字0~3.3`});
                    node.error("输入的msg.payload.voltage必须为: 数字0~3.3");
                    return;
                }
            }else{
                node.status({fill:"blue",shape:"ring",text: `只有输入为msg.payload.voltage字段才有效`});
                return;
            }
            
            // 构造POST请求的payload
            let temp_Pin = parseInt(node.pin)
            let temp_Voltage = msg.payload.voltage
            var postPayload = {
                Pin:temp_Pin,
                Voltage: temp_Voltage
            };
        
            arg_obj["arg_pin"] = temp_Pin
            arg_obj["arg_voltage"] = temp_Voltage

            if(obj_paraStatus.parameter_status == 0){
                sendHttpRequest('post', request_url, postPayload, node, arg_obj);
            }
        });
    }

    RED.nodes.registerType("DAC", DAC_NodeFunc);
};



