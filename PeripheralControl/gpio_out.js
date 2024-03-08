
const axios = require('axios');

const server_gpioOut_url = "http://10.1.2.3:5000/peripheral/gpio/out";

module.exports = function(RED) {

    function HttpRequestCustomNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.pin = config.pin;
        node.level = config.level;
        node.set = config.set

        // 判断Pin只由字符串组成
        function isDigitsOnly(str) {
            var regex = /^[0-9]+$/;
            return regex.test(str);
        }
        
        if (!isDigitsOnly(node.pin)) {
            node.status({fill:"red",shape:"ring",text: '请输入正确的引脚'});
            return
        }else{
            node.status({});
        }

        // 若勾选了引脚电平初始化
        if (node.set == true) {
            // 构造POST请求的payload
            var postPayload = {
                Pin: parseInt(node.pin),
                Level: (node.level === "1") ? 1 : 0 
            };
            // console.log(JSON.stringify(postPayload))
            const axiosConfig = {
                method: 'post',
                url: server_gpioOut_url,
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
                            node.status({fill: "green",shape: "ring",text: `引脚电平初始化成功`});
                        }
                    }
                })
                .catch(function (error) {
                    node.error("Pin init error: " + error)
                });
        }else{
            node.status({});
        }




        node.on('input', function(msg) {
            // 校验输入是否为数字0/1或布尔值
            let payload = msg.payload;
            if (payload !== 0 && payload !== 1 && payload !== '0' && payload !== '1' && typeof payload !== 'boolean') {
                node.error("输入的payload必须为: \n1) 文本0/1 \n2) 数字0/1 \n3) 布尔值true/false");
                return;
            }

            // 构造POST请求的payload
            let temp_Pin = parseInt(node.pin)
            let temp_Level = (payload === true || payload === 1 || payload === '1') ? 1 : 0 // 根据需求，可以调整逻辑
            var postPayload = {
                Pin:temp_Pin,
                Level: temp_Level
            };
            // console.log(JSON.stringify(postPayload))
        

            const axiosConfig = {
                method: 'post',
                url: server_gpioOut_url,
            };

            axiosConfig.data = postPayload; // 对于POST请求，使用msg.payload作为请求体

            axios(axiosConfig)
                .then(function (response) {
                    // 对从pyServer返回的response做处理(只输出了错误信息)
                    if (response.data.hasOwnProperty('result')) {
                        if (response.data.result == false) {
                            node.status({fill:"red",shape:"ring",text: response.data.error_type});
                        }else{
                            node.status({fill: "green",shape: "ring",text: `Pin:${temp_Pin} Level:${temp_Level}`});
                        }
                    }

                })
                .catch(function (error) {
                    node.error(error);
                });
        });
    }


    RED.nodes.registerType("GPIO Out", HttpRequestCustomNode);
};



