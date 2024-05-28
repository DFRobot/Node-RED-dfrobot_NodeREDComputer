
const axios = require('axios');

const request_url = "http://10.1.2.3:5000/peripheral/gpio/out";

module.exports = function(RED) {

    function gpioOut_NodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.pin = config.pin;
        node.level = config.level;
        node.set = config.set;

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
                            let message = {"payload":{"pin": arg_obj.arg_pin, "level": arg_obj.arg_level, "type": "GPIO_OUT", "error": response.data.error_msg}}
                            node.send(message)
                        }else{
                            node.status({fill: "green", shape: "ring", text: `Pin:${arg_obj.arg_pin} Level:${arg_obj.arg_level}`});
                            let message = {"payload":{"pin": arg_obj.arg_pin, "level": arg_obj.arg_level, "type": "GPIO_OUT"}}
                            node.send(message)
                        }
                    }
                })
                .catch(function (error) {
                    node.status({fill:"red",shape:"ring",text: error});
                    let message = {"payload":{"pin": arg_obj.arg_pin, "level": arg_obj.arg_level, "type": "GPIO_OUT", "error": error}}
                    node.send(message)
                });
        }

        // 2、验证函数
        // 2.1 检查js对象中的字段是否为空（本Block中可不做空判断，已在server端处理）
        function isPayloadValid(payload) {
            for (let key in payload) {
                if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
                    return false; // 返回false，表示有空字段
                }
            }
            return true;
        }

        // 2.2 判断Pin只由字符串组成（本Block中可不详细的pin验证，已在server端处理）
        function isDigitsOnly(str) {
            var regex = /^[0-9]+$/;
            return regex.test(str);
        }

    
/*****************************************************************************************
 * 二、部署时执行
 *****************************************************************************************/ 
        node.status({});  
        let postPayload = {
            Pin: node.pin,
            Level: (node.level === "1") ? 1 : 0
        };

        
/*****************************************************************************************
 * 三、输入触发执行
 *****************************************************************************************/ 
        node.on('input', function(msg) {
            let arg_pin = "";
            let arg_level = "";
            node.status({}); 
            let arg_obj = {"arg_pin": node.pin, "arg_level": ((node.level === "1") ? 1 : 0)}

            // 未使用输入流更改属性
            if(node.set == false){
                sendHttpRequest('post', request_url, postPayload, node, arg_obj);
                return
            }

            // 使用输入流更改属性
            obj_paraStatus.parameter_status = 0;
            const valid_arg = new Set([0, 1, '0', '1', true, false]); // 校验输入参数的有效性

            // 流输入参数——>msg.payload.pin/msg.payload.level
            if(msg.payload.hasOwnProperty('pin')){
                if(typeof msg.payload.pin === 'number'){
                    arg_pin = String(msg.payload.pin)
                }else if(typeof msg.payload.pin === 'string'){
                    arg_pin = msg.payload.pin
                }else{
                    node.error("输入流中的msg.payload.pin必须为: \n1) 文本 \n2) 数字");
                    obj_paraStatus.parameter_status = -1;
                }
            }

            if(msg.payload.hasOwnProperty('level')){
                if (!valid_arg.has(msg.payload.level)) {
                    node.error("输入的msg.payload.level必须为: \n1) 文本0/1 \n2) 数字0/1 \n3) 布尔值true/false");
                    obj_paraStatus.parameter_status = -1;
                }else{
                    arg_level = (msg.payload.level === true || msg.payload.level === 1 || msg.payload.level === '1') ? 1 : 0 
                }
            }

            arg_obj["arg_pin"] = arg_pin;
            arg_obj["arg_level"] = arg_level;
            postPayload.Pin = arg_pin
            postPayload.Level = arg_level

            if(obj_paraStatus.parameter_status == 0){
                sendHttpRequest('post', request_url, postPayload, node, arg_obj);
            }
        });
    }

    RED.nodes.registerType("GPIO输出", gpioOut_NodeFunc);
};



