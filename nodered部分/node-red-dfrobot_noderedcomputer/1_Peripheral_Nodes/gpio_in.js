
const axios = require('axios');

const request_url = "http://10.1.2.3:5000/peripheral/gpio/in";

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

        node.on('input', function(msg, send, done) {
            var messages = new Array(node.rules.length).fill(null); // 初始化并清空messages数组
            var msg = {'topic': "gpio in", 'payload': ""}

            // 使用for循环发送请求和处理响应
            for (let index = 0; index < node.rules.length; index++) {
                messages.fill(null);
                messages[index] = RED.util.cloneMessage(msg)
                if (!isDigitsOnly(node.rules[index].pin)) {
                    messages[index].payload = {"pin": node.rules[index].pin, "type": "GPIO_IN", "error": `输出端口${index+1}:引脚编号格式错误`}
                    send(messages); 
                    continue;
                }

                let temp_Pin = node.rules[index].pin
                var postPayload = {
                    Pin:temp_Pin
                };

                const axiosConfig = {
                    method: 'post',
                    url: request_url,
                    data: postPayload 
                };

                axios(axiosConfig)
                    .then(function (response) {
                        messages.fill(null);
                        messages[index] = RED.util.cloneMessage(msg)
                        messages[index].payload = response.data
                        messages[index].payload["type"] = "GPIO_IN"
                        send(messages); 
                    })
                    .catch(function (error) {
                        node.status({fill:"red",shape:"ring",text: error});
                    })
                    .finally(function() {
                        // 删除循环引用的属性
                        delete axiosConfig.data;
                        delete axiosConfig.transformRequest;
                        delete axiosConfig.transformResponse;
                    });
            }
        });
    }

    RED.nodes.registerType("GPIO输入", GPIO_IN_FUNC);
};

