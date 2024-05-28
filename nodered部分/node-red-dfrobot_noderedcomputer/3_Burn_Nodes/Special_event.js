
const mqtt = require('mqtt');
const uuid = require('uuid');

module.exports = function(RED) {
    "use strict";
    var exec = require('child_process').exec;
    var fs = require('fs');

    function Exec_NodeFunc(n) {
        RED.nodes.createNode(this,n);

        var node = this;
        node.action = n.action
        node.devName = n.devName
        node.SpecialEvents = n.SpecialEvents
        const uniqueId = uuid.v4(); // 生成唯一ID

        this.activeProcesses = {};
        this.oldrc = (n.oldrc || false).toString();
        this.execOpt = {encoding:'binary', maxBuffer:RED.settings.execMaxBufferSize||10000000};

        if (process.platform === 'linux' && fs.existsSync('/bin/bash')) { node.execOpt.shell = '/bin/bash'; }


        function exec_command() {
            var msg = {"_msgid": "", "payload": "", "topic":""}

            var child;
            var arg;

            arg = `/root/NodeRED-Computer-PartHardware/Executable-Script/Block-Burn/SpecialEvent -${node.SpecialEvents} -${uniqueId}`;

            node.debug(arg);
            child = exec(arg, node.execOpt, function (error, stdout, stderr) {
                var msg2, msg3;
                delete msg.payload;
                if (stderr) {
                    msg2 = RED.util.cloneMessage(msg);
                    msg2.payload = stderr;
                }
                msg.payload = Buffer.from(stdout,"binary");
                
                node.status({});

                if (error !== null) {
                    msg3 = RED.util.cloneMessage(msg);
                    msg3.payload = {code:error.code, message:error.message};
                    if (error.signal) { msg3.payload.signal = error.signal; }
                    if (error.code === null) { node.status({fill:"red",shape:"dot",text:"killed"}); }
                    else { node.status({fill:"red",shape:"dot",text:"error:"+error.code}); }
                    node.debug('error:' + error);
                }
                else if (node.oldrc === "false") {
                    msg3 = RED.util.cloneMessage(msg);
                    msg3.payload = {code:0};
                }
                if (!msg3) { node.status({}); }
                else {
                    msg.rc = msg3.payload;
                    if (msg2) { msg2.rc = msg3.payload; }
                }
                if (child.tout) { clearTimeout(child.tout); }
                delete node.activeProcesses[child.pid];

            });
            node.status({fill:"blue",shape:"dot",text:"pid:"+child.pid});
            child.on('error',function() {});

            node.activeProcesses[child.pid] = child;
        }


        // 1、执行外部脚本
        exec_command()

        //2、配置mqtt客户端

        var client = mqtt.connect('mqtt://10.1.2.3:1883', {
            clientId: "mqtt-custom-node-" + Math.random().toString(16).substr(2, 8),
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000,
            qos: 0
        });

        client.on('connect', function () {
            node.log('Connected to MQTT broker');
            client.subscribe(`device/special_events/-${node.SpecialEvents}/-${uniqueId}`, { qos: 0 });
            // node.status({fill:"green",shape:"dot",text:"connected"});
        });

        client.on('message', function (topic, message) {
            let payload_data = "";
            try {
                payload_data = JSON.parse(message);
            } catch (e) {
                node.error("ERROR: Listen to data in non-Json format", message);
                return;
            }

            // 筛选action
            if(payload_data.action == node.action || node.action == 'both'){
                var msg = { topic: topic, payload: payload_data };
                node.send(msg);
            }


        });

        client.on('error', function (error) {
            // node.error('MQTT client error', error);
            // node.status({fill:"red",shape:"ring",text:"connection failed"});
        });



        this.on('close',function() {

            if (client && client.connected) {
                client.end();
            }

            for (var pid in node.activeProcesses) {
                /* istanbul ignore else  */
                if (node.activeProcesses.hasOwnProperty(pid)) {
                    if (node.activeProcesses[pid].tout) { clearTimeout(node.activeProcesses[pid].tout); }
                    var process = node.activeProcesses[pid];
                    node.activeProcesses[pid] = null;
                    process.kill();
                }
            }
            node.activeProcesses = {};
            node.status({});
        });
    }
    RED.nodes.registerType("特殊烧录事件",Exec_NodeFunc);
}
