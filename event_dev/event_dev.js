const mqtt = require('mqtt');

module.exports = function(RED) {

    function MqttCustomNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.action = config.action
        node.devName = config.devName
        node.set = config.set
        // name: {value:""},
        // action:  {value:"none"},
        // devName:  {value:""},
        // set: {value:""}

        function filter_devEvent() {
            // 若勾选了过滤复选框
            if (node.set == true) {

            }
        }

        filter_devEvent();



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
            client.subscribe('dev/events', { qos: 0 });
            node.status({fill:"green",shape:"dot",text:"connected"});
        });

        // mqtt收到信息
        client.on('message', function (topic, message) {
            
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

            // 若勾选了过滤复选框
            if (node.set == true) {
                if(payload_data.hasOwnProperty("action") && payload_data.hasOwnProperty("devName")){
                    var msg = { topic: topic, payload: payload_data };
                    // 筛选action与devName
                    if(payload_data.action == node.action || node.action == 'none'){
                        if(payload_data.devName == node.devName || node.devName == ""){
                            node.send(msg);
                        }  
                    }
                }
            }else{
                var msg = { topic: topic, payload: payload_data };
                node.send(msg);
            }

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

    }


    RED.nodes.registerType("Dev Event", MqttCustomNode);
};



