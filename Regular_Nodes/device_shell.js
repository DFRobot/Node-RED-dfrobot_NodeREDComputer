
const axios = require('axios');

module.exports = function(RED) {

    function DevShellNodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.IP_Port = config.IP_Port
        node.identity = config.identity
        node.cmd = config.cmd



        node.on('input', function(msg) {

            var url = "http://" + node.IP_Port + "/linuxdev/internal/shell"
            console.log(url)


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
                    // 对从服务器返回的response做处理
                    console.log(response.data)
                    msg.payload = response.data
                    node.send(msg)
                    // if (response.data.hasOwnProperty('result')) {
                    //     if (response.data.result == false) {
                    //         node.status({fill:"red",shape:"ring",text: response.data.error_type});
                    //     }else{
                    //         // node.status({fill: "blue",shape: "ring",text: `Operation successful!`});
                    //     }
                    // }
                })
                .catch(function (error) {
                    // node.error(error);
                    node.status({fill:"red",shape:"ring",text: error});
                });
        });

    }

    RED.nodes.registerType("Dev Shell", DevShellNodeFunc);
};







