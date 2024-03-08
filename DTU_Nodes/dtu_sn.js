
const axios = require('axios');
const mqtt = require('mqtt');
const server_dtuATConfig_url = "http://10.1.2.3:5000/dtu/at/dtu_config";


module.exports = function(RED) {

    function DTUConfigFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;

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
            client.subscribe('dtu/at/get_sn', { qos: 0 });
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

            tempmsg.payload = payload_data
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
        node.on('input', function(msg) {

            // 筛选 add  /dev/ttyACMx
            if(msg.payload.hasOwnProperty('devName')){
                if(!msg.payload.devName.includes('/dev/ttyACM')){
                    if(!msg.payload.devName == '/dev/serial')   node.error("输入必须为ttyACM类型的设备");
                    return
                }    
            }else{
                node.error("输入必须含有msg.payload.devName字段");
                return
            }
            if(msg.payload.hasOwnProperty('action')){
                if(msg.payload.action == 'remove')  return
            }else{
                return
            }


            // 构造POST请求的payload
            var postPayload = {
                devname: msg.payload.devName,
                atType: 'dtu_config',
                config1: 'get_sn',
                config2: 'none',
                config3: 'none',
                region: node.region
            };

            // console.log(postPayload)

            const axiosConfig = {
                method: 'post',
                url: server_dtuATConfig_url,
            };

            axiosConfig.data = postPayload; // 对于POST请求，使用msg.payload作为请求体

            axios(axiosConfig)
                .then(function (response) {
                    // 对从pyServer返回的response做处理(只输出了错误信息)
                    if (response.data.hasOwnProperty('result')) {
                        if (response.data.result == false) {
                            node.status({fill:"red",shape:"ring",text: response.data.error_type});
                        }else{
                            // node.status({fill: "blue",shape: "ring",text: `Obtaining gateway SN`});
                        }
                    }

                })
                .catch(function (error) {
                    node.error(error);
                });
        });
    }

    RED.nodes.registerType("DTU SN", DTUConfigFunc);
};










  

  




