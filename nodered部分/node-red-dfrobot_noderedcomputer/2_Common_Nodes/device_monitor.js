const mqtt = require('mqtt');

module.exports = function(RED) {

    function deviceMonitor_NodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.set = config.set
        node.action = config.action
        node.device_name = config.device_name
       
        node.setIOin = config.setIOin
        node.edge = config.edge

        // MQTT相关
        var client = mqtt.connect('mqtt://10.1.2.3:1883', {
            clientId: "mqtt-custom-node-" + Math.random().toString(16).substr(2, 8),
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000,
            qos: 0
        });

        client.on('connect', function () {
            node.log('Connected to MQTT broker');
            client.subscribe('device/monitor', { qos: 0 });
            node.status({fill:"green",shape:"dot",text:"connected"});
        });

        client.on('message', function (topic, message) {
            
            let payload_data = "";
            try {
                payload_data = JSON.parse(message);
            } catch (e) {
                node.error("ERROR: Listen to data in non-Json format", message);
                return;
            }
            // 若勾选了过滤复选框
            if (node.set == true) {
                if(payload_data.hasOwnProperty("action") && payload_data.hasOwnProperty("device_name")){
                    var msg1 = { topic: topic, payload: payload_data };
                    // 筛选action与device_name
                    if(payload_data.action == node.action || node.action == 'both'){
                        // if(payload_data.device_name == node.device_name || node.device_name == ""){
                        if(payload_data.device_name.includes(node.device_name) || node.device_name == ""){
                            node.send(msg1);
                        }  
                    }
                } 
            }else{
                var msg = { topic: topic, payload: payload_data };
                node.send(msg);
            }
        });

        client.on('error', function (error) {
            node.status({fill:"red",shape:"ring",text:"connection failed"});
        });

        node.on('close', function () {
            if (client && client.connected) {
                client.end();
            }
        });

    }


    RED.nodes.registerType("设备监听", deviceMonitor_NodeFunc);
};



