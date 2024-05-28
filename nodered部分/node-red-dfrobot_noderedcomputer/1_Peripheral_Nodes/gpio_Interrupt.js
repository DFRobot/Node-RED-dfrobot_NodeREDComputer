
const mqtt = require('mqtt');
const uuid = require('uuid');

module.exports = function(RED) {
    "use strict";
    var exec = require('child_process').exec;
    var fs = require('fs');

    function IO_Interrupt_NodeFunc(n) {
        RED.nodes.createNode(this,n);

        this.activeProcesses = {};
        this.oldrc = (n.oldrc || false).toString();
        this.execOpt = {encoding:'binary', maxBuffer:RED.settings.execMaxBufferSize||10000000};
        var node = this;
        node.pin = n.pin
        node.mode = n.mode
        node.interrupt = n.interrupt
        const uniqueId = uuid.v4(); // 生成唯一ID

        if (process.platform === 'linux' && fs.existsSync('/bin/bash')) { node.execOpt.shell = '/bin/bash'; }


        function exec_command() {
            var msg = {"_msgid": "", "payload": "", "topic":""}

            var child;
            var arg = `python3 /root/NodeRED-Computer-PartHardware/Executable-Script/Block-peripheral/IO_Interrupt.py -Pin "${node.pin}" -Mode "${node.mode}" -Interrupt "${node.interrupt}" -uuid "${uniqueId}"`;

            /* istanbul ignore else  */
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

        // -----------------------------------------主要逻辑：
        // -----------------------------------------1、执行外部脚本
        exec_command()

        //-----------------------------------------2、配置mqtt客户端
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
            client.subscribe(`gpio/interrupt/${uniqueId}`, { qos: 0 });
            node.status({fill:"green",shape:"dot",text:"connected"});
        });

        // mqtt收到信息
        client.on('message', function (topic, message) {
        
            let payload_data = "";

            // 尝试将JSON字符串解析为JavaScript对象 
            try {
                payload_data = JSON.parse(message);
            } catch (e) {
                // 如果解析失败，抛出错误并退出函数
                node.error("ERROR: Listen to data in non-Json format", message);
                return;
            }
            var msg = { topic: topic, payload: payload_data };
            node.send(msg);
        });

        // mqtt错误信息
        client.on('error', function (error) {
            node.status({fill:"red",shape:"ring",text:"connection failed"});
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
    RED.nodes.registerType("IO中断", IO_Interrupt_NodeFunc);
}
