
const axios = require('axios');

module.exports = function(RED) {

    function deviceShell_NodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.IP_Port = config.IP_Port
        node.identity = config.identity
        node.cmd = config.cmd
        

        if(node.IP_Port == ""){
            node.status({fill:"red",shape:"ring",text: "IP:Port字段不能为空"});
        }

        node.on('input', function(msg) {
            node.status({});

            if(node.IP_Port == ""){
                node.status({fill:"red",shape:"ring",text: "IP:Port字段不能为空"});
                return
            }

            var url = "http://" + node.IP_Port + "/linuxdev/internal/shell"

            var postPayload = {
                "command": node.cmd,
                "identity": node.identity
            }

            if(msg.payload.hasOwnProperty('shell')){
                postPayload.command = msg.payload.shell
            }

            const axiosConfig = {
                method: 'post',
                url: url,
                data: postPayload
            };
            axios(axiosConfig)
                .then(function (response) {
                    msg.payload = response.data
                    node.send(msg)
                })
                .catch(function (error) {
                    node.status({fill:"red",shape:"ring",text: error});
                });
        });

    }

    RED.nodes.registerType("Device Shell", deviceShell_NodeFunc);
};







