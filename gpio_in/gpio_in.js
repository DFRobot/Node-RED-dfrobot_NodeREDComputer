

const axios = require('axios');

const server_gpioIn_url = "http://10.1.2.3:5000/peripheral/gpio/in";


module.exports = function(RED) {

    function GPIO_IN_FUNC(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.rules = config.rules;


        // 判断Pin只由数字组成
        function isDigitsOnly(str) {
            var regex = /^[0-9]+$/;
            return regex.test(str);
        }

        // const util = require('util');

        node.on('input', function(msg, send, done) {
            var messages = new Array(node.rules.length).fill(null); // 初始化并清空messages数组
            var msg = {'topic': "gpio in", 'payload': ""}

            // 使用for循环发送请求和处理响应
            for (let index = 0; index < node.rules.length; index++) {
                messages[index] = RED.util.cloneMessage(msg)
                if (!isDigitsOnly(node.rules[index].pin)) {
                    messages[index].payload = {"error_type": `输出端口${index+1}:引脚格式错误`}
                    continue;
                }

                // 构造POST请求的payload
                let temp_Pin = parseInt(node.rules[index].pin)
                // console.log('temp_Pin = ', temp_Pin)
                var postPayload = {
                    Pin:temp_Pin
                };

                const axiosConfig = {
                    method: 'post',
                    url: server_gpioIn_url,
                    data: postPayload // 对于POST请求，使用msg.payload作为请求体
                };

                axios(axiosConfig)
                    .then(function (response) {
                        // 对从pyServer返回的response做处理(只输出了错误信息)
                        // console.log('response = ', util.inspect(response, { showHidden: false, depth: null }));
                        messages[index].payload = response.data

                    })
                    .catch(function (error) {
                        messages[index].payload = error
                        // node.error(error);
                    })
                    .finally(function() {
                        // 删除循环引用的属性
                        delete axiosConfig.data;
                        delete axiosConfig.transformRequest;
                        delete axiosConfig.transformResponse;

                        if (index === node.rules.length - 1) {
                            // console.log(JSON.stringify(messages))
                            // send([{topic:"", payload: "123"}, {topic:"", payload: "456"}, {topic:"", payload: "789"}]); 
                            send(messages); 
                            done();
                        }
                    });
            }
        });


    }

    RED.nodes.registerType("GPIO In", GPIO_IN_FUNC);
};

