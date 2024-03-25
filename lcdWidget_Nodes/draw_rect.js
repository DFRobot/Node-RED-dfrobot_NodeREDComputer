const uuid = require('uuid');
const axios = require('axios');
const url_lcd_draw = "http://10.1.2.3:5000/lcd/draw";

global.global_num = 0;

module.exports = function(RED) {

    function drawLineFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.coord_x = config.coord_x
        node.coord_y = config.coord_y
        node.width = config.width
        node.height = config.height
        node.line_width = config.line_width
        node.fill_color = config.fill_color
        node.border_color = config.border_color
        node.border_radius = config.border_radius
        node.custom_color1 = config.custom_color1
        node.custom_color2 = config.custom_color2
        node.priority = config.priority
        node.set = config.set
        
// -------------------------------------------------------------------------------------函数合集
        /* 检验参数的有效性: 检查字符串是否全为0-9的数字字符组成 */
        function CheckStr(str) {
            let regex = /^[0-9]+$/;
            if (!regex.test(str)) {
                node.status({fill:"red",shape:"ring",text: "绘制矩形的参数格式填写错误"});
                global.global_num = -1;
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
        global.global_num = 0; // 参数无效时，禁用发送绘图指令
        let stringList = [node.coord_x, node.coord_y, node.width, node.height, node.line_width, node.border_radius];    // 创建一个字符串列表
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
        var F_color = ''
        var B_color = ''
        if(node.fill_color != "custom"){
            F_color = node.fill_color
        }else{
            const regex = /^#[0-9A-Fa-f]{6}$/;
            if (regex.test(node.custom_color1)) {
                F_color = node.custom_color1
            } else {
                node.status({fill: "red",shape: "ring",text: `自定义颜色格式错误,矩形填充色默认恢复为白色`});
                F_color = "#FFFFFF"
            }
        }
        if(node.border_color != "custom"){
            B_color = node.border_color
        }else{
            const regex = /^#[0-9A-Fa-f]{6}$/;
            if (regex.test(node.custom_color2)) {
                B_color = node.custom_color2
            } else {
                node.status({fill: "red",shape: "ring",text: `自定义颜色格式错误,矩形边框色默认恢复为黑色`});
                B_color = "#000000"
            }
        }
        var postPayload_init = {
            draw_type: 'draw_rect',
            x: parseInt(node.coord_x),
            y: parseInt(node.coord_y),
            width: parseInt(node.width),
            height: parseInt(node.height),
            line_width: parseInt(node.line_width),
            fill_color: F_color,
            border_color: B_color,
            border_radius: parseInt(node.border_radius),
            priority: temp_priority,   // 默认优先级定为7
            id: uniqueId,
        }; 
        if(global.global_num == 0){
            sendHttpRequest('post', url_lcd_draw, postPayload_init, node);
        }
        

// ----------------------------------------------
        /* 2、触发输入后执行 */
        node.on('input', function(msg) {
            // 验证输入是否含有color字段
            if(!msg.payload.hasOwnProperty("color")){
                node.status({fill: "red",shape: "ring",text: `请使用更改属性的节点的流作为输入`});
                return;
            }

            var postPayload_input = {
                draw_type: 'draw_rect',
                x: parseInt(node.coord_x),
                y: parseInt(node.coord_y),
                width: parseInt(node.width),
                height: parseInt(node.height),
                line_width: parseInt(node.line_width),
                fill_color: msg.payload.fill_color,
                border_color: msg.payload.border_color,
                border_radius: parseInt(node.border_radius),
                priority: temp_priority,   // 默认优先级定为7
                id: uniqueId,
            };
            if(global.global_num == 0){
                sendHttpRequest('post', url_lcd_draw, postPayload_input, node);
            }
        });

    }

    RED.nodes.registerType("rectangle", drawLineFunc);
};



  




