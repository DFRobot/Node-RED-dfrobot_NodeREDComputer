
const axios = require('axios');
const mqtt = require('mqtt');

const server_CH58xBurn_url = "http://10.1.2.3:5000/ch58x/burn";

module.exports = function(RED) {

    function ch58xBurn_NodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.chip = config.chip;
        node.firmware_codeflash = config.firmware_codeflash;
        node.firmware_dataflash = config.firmware_dataflash;
        node.setReset = config.setReset;
        node.set = config.set;

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
            client.subscribe('ch58x/burn', { qos: 0 });
            node.status({fill:"green",shape:"dot",text:"connected"});
        });

        // mqtt收到信息
        client.on('message', function (topic, message) {
            var tempmsg = {'topic': topic, 'payload': ""}

            const Json_payload = message;   
            let payload_data;

            try {
                payload_data = JSON.parse(Json_payload);
            } catch (e) {
                node.error("ERROR: Listen to data in non-Json format", message);
                return;
            }

            if(payload_data.result == true){
                node.status({fill: "green",shape: "ring",text: `Burning is complete`});
            }else{
                node.status({fill: "red",shape: "ring",text: `Burning error`});
            }
            
            tempmsg.payload = payload_data;
            node.send(tempmsg);  // 发送消息
            

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

            // 筛选 add  /dev/ch37x
            if(msg.payload.hasOwnProperty('device_name')){
                if(!msg.payload.device_name.includes('/dev/ch37x')){
                    if(!msg.payload.device_name == '/dev/serial')   node.error("输入必须为ch37x类型的设备");
                    return
                }    
            }else{
                node.error("输入必须含有msg.payload.device_name字段");
                return
            }
            if(msg.payload.hasOwnProperty('action')){
                if(msg.payload.action == 'remove')  return
            }else{
                return
            }



            var postPayload = {
                chip: node.chip,
                device_name: '',
                firmware_codeflash: node.firmware_codeflash,
                firmware_dataflash: '',
                IsAfterDownRest: 'false'
            };

            if (node.setReset == true) {
                postPayload.IsAfterDownRest = 'true'
            }

            if (node.set == true) {
                postPayload.firmware_dataflash = node.firmware_dataflash
            }else{
                postPayload.firmware_dataflash = 'none'
            }

            if(msg.payload.hasOwnProperty("device_name")){
                postPayload.device_name = msg.payload.device_name
            }

            const axiosConfig = {
                method: 'post',
                url: server_CH58xBurn_url,
            };

            axiosConfig.data = postPayload; 

            axios(axiosConfig)
                .then(function (response) {
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


    RED.nodes.registerType("CH58x烧录", ch58xBurn_NodeFunc);
};













  



