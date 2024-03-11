
const axios = require('axios');
const mqtt = require('mqtt');


module.exports = function(RED) {

    function FlowCountNodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.set = config.set
        node.region = config.region
        node.version = config.version

        // ---------------------------------------------------mqtt部分-----------------------------
        // mqtt配置连接参数
        var client = mqtt.connect('mqtt://10.1.2.3:1883', {
            clientId: "mqtt-custom-node-" + Math.random().toString(16).substr(2, 8),
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000,
            qos: 0
        });

        // mqtt连接成功后，订阅主题
        client.on('connect', function () {
            node.log('Connected to MQTT broker');
            client.subscribe('gateway/burn/otp', { qos: 0 });
            client.subscribe('gateway/encrypt/sn', { qos: 0 });
            node.status({fill:"green",shape:"dot",text:"connected"});
        });

        // mqtt收到信息
        client.on('message', function (topic, message) {

            const Json_payload = message;   // 解析输入的消息payload（假定其为JSON字符串）
            let payload_data;

            // 尝试将JSON字符串解析为JavaScript对象 
            try {
                payload_data = JSON.parse(Json_payload);
            } catch (e) {
                // 如果解析失败，抛出错误并退出函数
                node.error("ERROR: Listen to data in non-Json format", message);
                return;
            }

            var msg = {'topic': topic, 'payload': payload_data}
            if(payload_data.hasOwnProperty('error')){
                node.status({fill: "green",shape: "ring",text: `Failed to burn OTP!`}); 
            }else{
                node.status({fill: "green",shape: "ring",text: `Burning OTP successfully!`}); 
            }
            // console.log(msg)
            node.send(msg);  // 发送消息
        });

        // mqtt错误信息
        client.on('error', function (error) {
            // node.error('MQTT client error', error);
            node.status({fill:"red",shape:"ring",text:"connection failed"});
        });

        // 关闭或删除节点，断开mqtt连接
        node.on('close', function () {
            if (client && client.connected) {
                client.end();
            }
        });


        // ---------------------------------------------------http部分-----------------------------

        // 通用的HTTP请求函数
        function sendHttpRequest(method, url, payload, node) {
            const axiosConfig = {
                method: method,
                url: url,
                data: payload
            };

            axios(axiosConfig)
                .then(function (response) {
                    // 对从服务器返回的response做处理
                    if (response.data.hasOwnProperty('result')) {
                        if (response.data.result == false) {
                            node.status({fill:"red",shape:"ring",text: response.data.error_type});
                        }else{
                            // node.status({fill: "blue",shape: "ring",text: `Operation successful!`});
                        }
                    }
                })
                .catch(function (error) {
                    node.error(error);
                });
        }


        node.on('input', function(msg) {
            
            var postPayload = {
                nodeType: 'Node_burnOTP',
                option1: 'burn_otp',
                region: node.region,
                version: node.version,
                option2: 'none',
                sn: 'none'
            };

            // 若勾选了加密SN
            if (node.set == true) {
                if(msg.payload.hasOwnProperty('sn')){
                    postPayload.sn = msg.payload.sn
                    postPayload.option2 = 'encrypt_sn'
                }else{
                    node.status({fill: "black",shape: "ring",text: `若勾选了加密序列号, 则输入必须含有sn字段!`});
                    // node.error('若勾选了加密序列号, 则输入必须含有sn字段');
                }
            }else{
                node.status({});
            }
            // console.log(postPayload)

            // 发送第一个POST请求
            sendHttpRequest('post', 'http://10.1.2.3:5000/gateway', postPayload, node);
        });

    }

    RED.nodes.registerType("Burn OTP", FlowCountNodeFunc);
};










  

  




