const uuid = require('uuid');
const axios = require('axios');
const url_lcd_draw = "http://10.1.2.3:5000/lcd/draw";


module.exports = function(RED) {

    function backgroundColorFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.background_color = config.background_color
        node.custom_color = config.custom_color
        node.priority = config.priority
        node.set = config.set
// -------------------------------------------------------------------------------------
        // 通用的HTTP请求函数
        function sendHttpRequest(method, url, payload, node) {
            const axiosConfig = {
                method: method,
                url: url,
                data: payload
            };

            axios(axiosConfig)
                .then(function (response) {
                    // 对从服务器返回的response做处理
                    if (response.data.hasOwnProperty('result')) {
                        if (response.data.result == false) {
                            node.status({fill:"red",shape:"ring",text: response.data.error_type});
                        }else{
                            // node.status({fill: "blue",shape: "ring",text: `Operation successful!`});
                        }
                    }
                })
                .catch(function (error) {
                    node.error(error);
                });
        }
        
// ----------------------------------------------
        const uniqueId = uuid.v4(); // 生成唯一 ID
    
        // 1、部署后执行
        node.status({});
        let obj = {global_num: 0}; // 参数无效时，禁用发送绘图指令(对象是以引用传递到函数内部的)
        let temp_priority = 6;

        if (node.set == true) {
            temp_priority = parseInt(node.priority) 
        }else{
            temp_priority = 6
        }

        console.log(temp_priority)

        var bk_color = ''
        if(node.background_color != "custom"){
            bk_color = node.background_color
        }else{
            const regex = /^#[0-9A-Fa-f]{6}$/;
            if (regex.test(node.custom_color)) {
                bk_color = node.custom_color
            } else {
                node.status({fill: "red",shape: "ring",text: `自定义背景颜色格式错误`});
                obj.global_num = -1
            }
        }

// ----------------------------------------------
        // 2、触发输入后执行
        node.on('input', function(msg) {
            node.status({});

            var postPayload_input = {
                draw_type: 'background_color',
                color: bk_color,
                id: uniqueId,
                priority: temp_priority
            }; 

            console.log(postPayload_input)

            if(msg.payload.hasOwnProperty("background_color")){
                postPayload_input.color = msg.payload.background_color
            }

            if(obj.global_num == 0){
                sendHttpRequest('post', url_lcd_draw, postPayload_input, node);
            }
        });

    }

    RED.nodes.registerType("background", backgroundColorFunc);
};



  




