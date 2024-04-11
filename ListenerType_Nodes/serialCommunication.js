const uuid = require('uuid');
const axios = require('axios');
const mqtt = require('mqtt');

const request_url = "http://10.1.2.3:5000/serial/communication";

module.exports = function(RED) {

    function serialCommunicationNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.port = config.port;
        node.baudrate = config.baudrate;
        node.baudrate_custom = config.baudrate_custom;
        node.responseTime = config.responseTime;
        node.cmd = config.cmd;
        const uniqueId = uuid.v4(); // 生成唯一 ID

// -------------------------------------------------------------------------------------
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
                    // node.error(error);
                    node.status({fill:"red",shape:"ring",text: error});
                });
        }

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
            client.subscribe(`serial/communication/${uniqueId}`, { qos: 0 });
            node.status({fill:"green",shape:"dot",text:"connected"});
        });

        // mqtt收到信息
        client.on('message', function (topic, message) {
            var tempmsg = {'topic': topic, 'payload': ""}
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
            
            tempmsg.payload = payload_data;
            node.send(tempmsg);  // 发送消息
            

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
        // 部署前：
        let obj = {global_num: 0}; // 参数无效时，禁用发送绘图指令(对象是以引用传递到函数内部的)
        let baudrate_option = ''
        if(node.baudrate != "custom"){
            baudrate_option = node.baudrate
        }else{
            const regex = /^[0-9]+$/;
            if (regex.test(node.baudrate_custom)) {
                baudrate_option = node.baudrate_custom
            } else {
                node.status({fill: "red",shape: "ring",text: `自定义波特率格式错误`});
                obj.global_num = -1
            }
        }

        node.on('input', function(msg) {

            var postPayload = {
                port: node.port,
                baudrate: baudrate_option,
                responseTime: node.responseTime,
                cmd: node.cmd,
                uuid: uniqueId
            };

            // 筛选msg.payload.cmd字段
            if(msg.payload.hasOwnProperty('cmd')){
                postPayload.cmd = msg.payload.cmd
            }

            if(obj.global_num == 0){
                sendHttpRequest('post', request_url, postPayload, node);
            }
        });
    }


    RED.nodes.registerType("serial", serialCommunicationNode);
};













  



