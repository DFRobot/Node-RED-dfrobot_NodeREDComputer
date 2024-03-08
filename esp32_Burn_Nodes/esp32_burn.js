
const axios = require('axios');
const mqtt = require('mqtt');

const server_esp32Burn_url = "http://10.1.2.3:5000/esp32/burn";

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
            client.subscribe('esp32/burn_result', { qos: 0 });
            node.status({fill:"green",shape:"dot",text:"connected"});
        });

        // mqtt收到信息
        client.on('message', function (topic, message) {
            var Mqttmsg = new Array(1).fill(null); // 初始化并清空messages数组
            var tempmsg = {'topic': "esp32/burn_result", 'payload': ""}
            Mqttmsg[0] = RED.util.cloneMessage(tempmsg)
            // 解析输入的消息payload（假定其为JSON字符串）
            const Json_payload = message;
            let payload_data;

            // 尝试将JSON字符串解析为JavaScript对象 
            try {
                payload_data = JSON.parse(Json_payload);
            } catch (e) {
                // 如果解析失败，抛出错误并退出函数
                node.error("ERROR: Listen to data in non-Json format", message);
                return;
            }

            Mqttmsg[0].payload = payload_data;
            node.send(Mqttmsg);

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

            // 筛选 add  /dev/ttyACMx
            if(msg.payload.hasOwnProperty('devName')){
                if(!msg.payload.devName.includes('/dev/ttyACM'))    return
            }else{
                return
            }
            if(msg.payload.hasOwnProperty('action')){
                if(msg.payload.action == 'remove')  return
            }else{
                return
            }

            // 构造POST请求的payload
            var postPayload = {
                devName:  msg.payload.devName,
                chip: node.chip,
                firmware:  node.firmware
            };
            // console.log(JSON.stringify(postPayload))
        

            const axiosConfig = {
                method: 'post',
                url: server_esp32Burn_url,
            };

            axiosConfig.data = postPayload; // 对于POST请求，使用msg.payload作为请求体

            axios(axiosConfig)
                .then(function (response) {
                    // 对从pyServer返回的response做处理(只输出了错误信息)
                    if (response.data.hasOwnProperty('result')) {
                        if (response.data.result == false) {
                            node.status({fill:"red",shape:"ring",text: response.data.error_type});
                        }else{
                            if (response.data.hasOwnProperty('message')) {
                                node.status({fill: "green",shape: "ring",text: `is burning`});
                                msg.payload = response.data.message
                                node.send(msg)
                            }
                        }
                    }

                })
                .catch(function (error) {
                    node.error(error);
                });
        });
    }


    RED.nodes.registerType("ESP32 Burn", HttpRequestCustomNode);
};













  



