
const axios = require('axios');
const mqtt = require('mqtt');

const server_esp32Burn_url = "http://10.1.2.3:5000/esp32/burn";

module.exports = function(RED) {

    function esp32Burn_NodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.chip = config.chip;
        node.custom_chip = config.custom_chip;
        node.firmware = config.firmware;

        // ---------------------------------------------------mqtt部分-----------------------------
        var client = mqtt.connect('mqtt://10.1.2.3:1883', {
            clientId: "mqtt-custom-node-" + Math.random().toString(16).substr(2, 8),
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000,
            qos: 0
        });

        client.on('connect', function () {
            node.log('Connected to MQTT broker');
            client.subscribe('esp32/burn_result', { qos: 0 });
            node.status({fill:"green",shape:"dot",text:"connected"});
        });

        client.on('message', function (topic, message) {
            var Mqttmsg = new Array(1).fill(null); 
            var tempmsg = {'topic': "esp32/burn_result", 'payload': ""}
            Mqttmsg[0] = RED.util.cloneMessage(tempmsg)
            const Json_payload = message;
            let payload_data;

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

        client.on('error', function (error) {
            // node.error('MQTT client error', error);
            node.status({fill:"red",shape:"ring",text:"connection failed"});
        });

        node.on('close', function () {
            if (client && client.connected) {
                client.end();
            }
        });
        
        

        // ---------------------------------------------------http部分-----------------------------
        node.on('input', function(msg) {
            node.status({});
            // 筛选 add  /dev/ttyACMx
            if(msg.payload.hasOwnProperty('device_name')){
                if(!msg.payload.device_name.includes('/dev/ttyACM') && !msg.payload.device_name.includes('/dev/ttyUSB'))    return
            }else{
                return
            }
            if(msg.payload.hasOwnProperty('action')){
                if(msg.payload.action == 'remove')  return
            }else{
                return
            }

            var postPayload = {
                device_name:  msg.payload.device_name,
                chip: node.chip,
                firmware:  node.firmware
            };
            console.log(JSON.stringify(postPayload))

            if(node.chip == "custom"){
                if(node.custom_chip == ""){
                    node.status({fill:"red",shape:"ring",text: "自定义芯片类型: 不能为空"});
                    return
                }
                postPayload["chip"] = node.custom_chip
            }

            const axiosConfig = {
                method: 'post',
                url: server_esp32Burn_url,
            };

            axiosConfig.data = postPayload;

            axios(axiosConfig)
                .then(function (response) {
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


    RED.nodes.registerType("ESP32烧录", esp32Burn_NodeFunc);
};




