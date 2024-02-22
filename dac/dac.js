
const axios = require('axios');

const server_DAC_url = "http://10.1.2.3:5000/peripheral/dac";


module.exports = function(RED) {

    function HttpRequestCustomNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.pin = config.pin;
        node.level = config.initVoltage;
        node.set = config.set


        function Init_DAC() {
            // 若勾选了引脚电平初始化
            if (node.set == true) {
                try {
                    let try_Pin = parseInt(node.pin)
                    let try_Level = parseFloat(node.level)
                } catch (error) {
                    node.status({fill:"red",shape:"ring",text: `输出电压初始值格式错误`});
                    return;
                }

                let temp_Pin = parseInt(node.pin)
                let temp_Level = parseFloat(node.level)
                // 构造POST请求的payload
                var postPayload = {
                    Pin: parseInt(node.pin),
                    Level: parseFloat(node.level)
                };
                // console.log(JSON.stringify(postPayload))
                const axiosConfig = {
                    method: 'post',
                    url: server_DAC_url,
                };
                axiosConfig.data = postPayload; 
                axios(axiosConfig)
                    .then(function (response) {
                        // 对从pyServer返回的response做处理(只输出了错误信息)
                        // console.log(response.data)
                        if (response.data.hasOwnProperty('result')) {
                            if (response.data.result == false) {
                                node.status({fill:"red",shape:"ring",text: `初始化:${response.data.error_type}`});
                            }else{
                                node.status({fill: "green",shape: "ring",text: `DAC${temp_Pin+1}初始电压: ${temp_Level}V`});
                            }
                        }
                    })
                    .catch(function (error) {
                        node.status({fill:"red",shape:"ring",text: `初始化:DAC输出电压格式错误`});
                        node.error("初始化:DAC输出电压格式错误: 初始化电压必须为数字0~3.3, " + error)
                        
                    });
            }else{
                node.status({});
            }
        }

        Init_DAC();

        node.on('input', function(msg) {
            try {
                // 校验输入是否为数字0~3.3
                let payload = msg.payload;
                if (payload < 0 && payload > 3.3) {
                    node.error("输入的payload必须为: 数字0~3.3");
                    return;
                }
            } catch (error) {
                node.status({fill:"red",shape:"ring",text: `输入必须为数字0~3.3`});
                return;
            }


            // 构造POST请求的payload
            let temp_Pin = parseInt(node.pin)
            let temp_Level = msg.payload
            var postPayload = {
                Pin:temp_Pin,
                Level: temp_Level
            };
            // console.log(JSON.stringify(postPayload))
        

            const axiosConfig = {
                method: 'post',
                url: server_DAC_url,
            };

            axiosConfig.data = postPayload; // 对于POST请求，使用msg.payload作为请求体

            axios(axiosConfig)
                .then(function (response) {
                    // 对从pyServer返回的response做处理(只输出了错误信息)
                    if (response.data.hasOwnProperty('result')) {
                        if (response.data.result == false) {
                            node.status({fill:"red",shape:"ring",text: response.data.error_type});
                        }else{
                            node.status({fill: "green",shape: "ring",text: `DAC${temp_Pin+1}  voltage:${temp_Level}V`});
                        }
                    }

                })
                .catch(function (error) {
                    node.status({fill:"red",shape:"ring",text: `DAC输出电压格式错误:输入必须为数字0~3.3`});
                    node.error("DAC输出电压格式错误: 输入必须为数字0~3.3, " + error)
                });
        });
    }


    RED.nodes.registerType("DAC", HttpRequestCustomNode);
};



