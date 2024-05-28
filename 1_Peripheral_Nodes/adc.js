
const axios = require('axios');

const server_ADC_url = "http://10.1.2.3:5000/peripheral/adc";

module.exports = function(RED) {

    function ADC_NodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.pin = config.pin;


        node.on('input', function(msg) {

            let temp_Pin = parseInt(node.pin)
            var postPayload = {
                Pin:temp_Pin,
            };
    
            const axiosConfig = {
                method: 'post',
                url: server_ADC_url,
            };

            axiosConfig.data = postPayload;

            axios(axiosConfig)
                .then(function (response) {
                    if (response.data.hasOwnProperty('result')) {
                        if (response.data.result == false) {
                            node.status({fill:"red",shape:"ring",text: response.data.error_type});
                            let message = {"payload":{"pin": `ADC${temp_Pin}`, "type": "ADC", "error": response.data.error_msg}}
                            node.send(message)
                        }else{
                            if (response.data.hasOwnProperty('voltage')) {
                                node.status({fill: "green",shape: "ring",text: `ADC${temp_Pin}  voltage:${response.data.voltage}V`});
                                msg.payload = {"pin": "", "voltage": "", "type": "ADC"};
                                msg.payload["pin"] = `ADC${temp_Pin}`
                                msg.payload["voltage"] = parseFloat(response.data.voltage)
                                node.send(msg)
                            }
                        }
                    }
                })
                .catch(function (error) {
                    node.status({fill:"red",shape:"ring",text: error});
                    // node.error(error);
                });
        });
    }


    RED.nodes.registerType("ADC", ADC_NodeFunc);
};



