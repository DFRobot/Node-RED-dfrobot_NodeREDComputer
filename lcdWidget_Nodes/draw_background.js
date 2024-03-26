const uuid = require('uuid');
const axios = require('axios');
const url_lcd_draw = "http://10.1.2.3:5000/lcd/draw";

global.global_num = 0;

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
        if (node.set == true) {
            temp_priority = parseInt(node.priority) 
        }else{
            temp_priority = 7
        }
        const uniqueId = uuid.v4(); // 生成唯一 ID
    
        // 1、部署后执行
        node.status({});
        global_num = 0; // 参数无效时，禁用发送绘图指令
        var bk_color = ''
        if(node.background_color != "custom"){
            bk_color = node.background_color
        }else{
            const regex = /^#[0-9A-Fa-f]{6}$/;
            if (regex.test(node.custom_color)) {
                bk_color = node.custom_color
            } else {
                node.status({fill: "red",shape: "ring",text: `自定义背景颜色格式错误`});
                global_num = -1
            }
        }

        if(global_num == 0){
            var postPayload_init = {
                draw_type: 'background_color',
                color: bk_color,
                id: uniqueId,
                priority: temp_priority
            }; 
            sendHttpRequest('post', url_lcd_draw, postPayload_init, node);
        }

// ----------------------------------------------
        // 2、触发输入后执行
        node.on('input', function(msg) {
            node.status({});
            // 验证输入是否含有color字段
            if(!msg.payload.hasOwnProperty("background_color")){
                node.status({fill: "red",shape: "ring",text: `请使用更改属性的节点的流作为输入, 且选择修改背景颜色`});
                return;
            }
            if(global_num == 0){
                var postPayload_input = {
                    draw_type: 'background_color',
                    color: msg.payload.background_color,
                    id: uniqueId,
                    priority: temp_priority
                };

                sendHttpRequest('post', url_lcd_draw, postPayload_input, node);
            }
        });

    }

    RED.nodes.registerType("background", backgroundColorFunc);
};



  




