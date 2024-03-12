
const axios = require('axios');
const mqtt = require('mqtt');
const server_GatewayGetSN_url = "http://10.1.2.3:5000/gateway";

module.exports = function(RED) {

    function FlowCountNodeFunc(config) {
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
            client.subscribe('gateway/post/login', { qos: 0 });
            client.subscribe('gateway/get/sn', { qos: 0 });
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
                node.status({fill: "green",shape: "ring",text: `Failed to obtain the gateway SN`}); 
            }else{
                node.status({fill: "green",shape: "ring",text: `The SN of the gateway is obtained`});
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
        node.on('input', function(msg) {


            var postPayload = {
                nodeType: 'Node_getSN'
            };

            const axiosConfig = {
                method: 'post',
                url: server_GatewayGetSN_url,
            };
            axiosConfig.data = postPayload;
            axios(axiosConfig)
                .then(function (response) {
                    // 对从pyServer返回的response做处理(只输出了错误信息)
                    if (response.data.hasOwnProperty('result')) {
                        if (response.data.result == false) {
                            node.status({fill:"red",shape:"ring",text: response.data.error_type});
                        }else{
                            node.status({fill: "blue",shape: "ring",text: `Obtaining gateway SN`});
                        }
                    }

                })
                .catch(function (error) {
                    node.error(error);
                });
        });
    }

    RED.nodes.registerType("GW SN", FlowCountNodeFunc);
};










  

  




