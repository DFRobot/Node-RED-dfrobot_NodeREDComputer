
const axios = require('axios');
const mqtt = require('mqtt');

const server_RockChipBurn_url = "http://10.1.2.3:5000/rockchip/burn";

module.exports = function(RED) {

    function HttpRequestCustomNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.chip = config.chip;
        node.firmware = config.firmware;

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
            client.subscribe('gateway/burn/progress', { qos: 0 });
            client.subscribe('gateway/burn/error', { qos: 0 });
            node.status({fill:"green",shape:"dot",text:"connected"});
        });

        // mqtt收到信息
        client.on('message', function (topic, message) {
            var Mqttmsg = new Array(2).fill(null); // 初始化并清空messages数组
            // var Mqttmsg = new Array(2)
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
            if(payload_data.hasOwnProperty("progress")){
                Mqttmsg[0] = RED.util.cloneMessage(tempmsg)
                Mqttmsg[0].payload = payload_data.progress;
                if(payload_data.progress == '100%'){
                    node.status({fill: "green",shape: "ring",text: `Burning is complete`});
                }
            }else{
                Mqttmsg[1] = RED.util.cloneMessage(tempmsg)
                Mqttmsg[1].payload = payload_data;
                node.status({fill: "red",shape: "ring",text: `Burning error`});
            }
            
            let num = 0
            // console.log('Mqttmsg = ',Mqttmsg)
            for (let i = 0; i < Mqttmsg.length; i++) {  // 遍历Mqttmsg数组
                if (Mqttmsg[i] !== null && Mqttmsg[i] !== undefined) {
                    num = num + 1
                }
            }

            if(num > 0) node.send(Mqttmsg);  // 发送消息
            

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
        node.on('input', function(msg) {

            // 构造POST请求的payload
            var postPayload = {
                chip: node.chip,
                firmware:  node.firmware
            };
        
            const axiosConfig = {
                method: 'post',
                url: server_RockChipBurn_url,
            };

            axiosConfig.data = postPayload; // 对于POST请求，使用msg.payload作为请求体

            axios(axiosConfig)
                .then(function (response) {
                    // 对从pyServer返回的response做处理(只输出了错误信息)
                    if (response.data.hasOwnProperty('result')) {
                        if (response.data.result == false) {
                            node.status({fill:"red",shape:"ring",text: response.data.error_type});
                        }else{
                            node.status({fill: "green",shape: "ring",text: `is burning`});
                        }
                    }

                })
                .catch(function (error) {
                    node.error(error);
                });
        });
    }


    RED.nodes.registerType("RockchipBurn", HttpRequestCustomNode);
};













  



