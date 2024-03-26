const uuid = require('uuid');
const axios = require('axios');
const url_lcd_draw = "http://10.1.2.3:5000/lcd/draw";

global.global_num = 0;

module.exports = function(RED) {

    function drawTextFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.text_content = config.text_content 
        node.coord_x = config.coord_x           // Need verification
        node.coord_y = config.coord_y           // Need verification
        node.font_size = config.font_size 
        node.custom_size = config.custom_size   // Need verification
        node.font_color = config.font_color
        node.custom_color = config.custom_color // Need verification
        node.priority = config.priority 
        node.set = config.set
        
// -------------------------------------------------------------------------------------函数合集
        /* 检验参数的有效性: 检查字符串是否全为0-9的数字字符组成 */
        function CheckStr(str) {
            let regex = /^[0-9]+$/;
            if (!regex.test(str)) {
                node.status({fill:"red",shape:"ring",text: "绘制文本的参数格式填写错误"});
                global_num = -1;
            }
        }

        /* 通用的HTTP请求函数 */
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
        /* 1、部署后执行 */
        global_num = 0; // 参数无效时，禁用发送绘图指令
        let stringList = [node.coord_x, node.coord_y];    // 创建一个字符串列表
        // 检验参数的有效性
        stringList.forEach((str, index) => {
            CheckStr(str)
        });

        if (node.set == true) {
            temp_priority = parseInt(node.priority) 
        }else{
            temp_priority = 7
        }

        const uniqueId = uuid.v4(); // 生成唯一ID

        node.status({});

        // 验证字体大小
        font_size_opt = ''
        if(node.font_size != "custom"){
            font_size_opt = node.font_size
        }else{
            const regex = /^[0-9]+$/;
            if (regex.test(node.custom_size)) {
                font_size_opt = node.custom_size
            } else {
                node.status({fill: "red",shape: "ring",text: `自定义字体大小的格式错误`});
                // font_size_opt = "32"
                global_num = -1
            }
        }

        // 验证字体颜色
        font_color_opt = ''
        if(node.font_color != "custom"){
            font_color_opt = node.font_color
        }else{
            const regex = /^#[0-9A-Fa-f]{6}$/;
            if (regex.test(node.custom_color)) {
                font_color_opt = node.custom_color
            } else {
                node.status({fill: "red",shape: "ring",text: `自定义字体颜色格式错误`});
                // font_color_opt = "#000000"
                global_num = -1
            }
        }

        if(global_num == 0){
            var postPayload_init = {
                draw_type: 'draw_text',
                text_content: node.text_content,
                x: parseInt(node.coord_x),
                y: parseInt(node.coord_y),
                font_size: parseInt(font_size_opt),
                font_color: font_color_opt,
                priority: temp_priority,   // 默认优先级定为7
                id: uniqueId,
            }; 
            sendHttpRequest('post', url_lcd_draw, postPayload_init, node);
        }
        

// ----------------------------------------------
        /* 2、触发输入后执行 */
        node.on('input', function(msg) {
            node.status({});
            // 验证输入是否含有color字段
            if(!msg.payload.hasOwnProperty("text_color")){
                node.status({fill: "red",shape: "ring",text: `请使用更改属性的节点的流作为输入, 且选择修改文本颜色`});
                return;
            }

            if(global_num == 0){
                var postPayload_input = {
                    draw_type: 'draw_text',
                    text_content: node.text_content,
                    x: parseInt(node.coord_x),
                    y: parseInt(node.coord_y),
                    font_size: parseInt(font_size_opt),
                    font_color: msg.payload.text_color,
                    priority: temp_priority,   // 默认优先级定为7
                    id: uniqueId,
                };
                sendHttpRequest('post', url_lcd_draw, postPayload_input, node);
            }
        });

    }

    RED.nodes.registerType("text", drawTextFunc);
};



  




