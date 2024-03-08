
const axios = require('axios');

const server_ADC_url = "http://10.1.2.3:5000/peripheral/adc";

module.exports = function(RED) {

    function HttpRequestCustomNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.pin = config.pin;


        node.on('input', function(msg) {


            // 构造POST请求的payload
            let temp_Pin = parseInt(node.pin)
            var postPayload = {
                Pin:temp_Pin,
            };
            // console.log(JSON.stringify(postPayload))
        

            const axiosConfig = {
                method: 'post',
                url: server_ADC_url,
            };

            axiosConfig.data = postPayload; // 对于POST请求，使用msg.payload作为请求体

            axios(axiosConfig)
                .then(function (response) {
                    // 对从pyServer返回的response做处理(只输出了错误信息)
                    if (response.data.hasOwnProperty('result')) {
                        if (response.data.result == false) {
                            node.status({fill:"red",shape:"ring",text: response.data.error_type});
                        }else{
                            if (response.data.hasOwnProperty('voltage')) {
                                node.status({fill: "green",shape: "ring",text: `ADC${temp_Pin}  voltage:${response.data.voltage}V`});
                                msg.payload = parseFloat(response.data.voltage)
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


    RED.nodes.registerType("ADC", HttpRequestCustomNode);
};



