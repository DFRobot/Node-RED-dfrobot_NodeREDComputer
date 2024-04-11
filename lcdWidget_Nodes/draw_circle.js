const uuid = require('uuid');
const axios = require('axios');
const url_lcd_draw = "http://10.1.2.3:5000/lcd/draw";


module.exports = function(RED) {

    function drawCircleFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.coord_x = config.coord_x           // Need verification
        node.coord_y = config.coord_y           // Need verification
        node.radius = config.radius             // Need verification
        node.line_width = config.line_width     // Need verification
        node.fill_color = config.fill_color
        node.border_color = config.border_color     
        node.custom_fill_color = config.custom_fill_color       // Need verification
        node.custom_border_color = config.custom_border_color   // Need verification
        node.priority = config.priority 
        node.set = config.set
        
// -------------------------------------------------------------------------------------函数合集
        /* 检验参数的有效性: 检查字符串是否全为0-9的数字字符组成 */
        function CheckStr(str, obj) {
            let regex = /^[0-9]+$/;
            if (!regex.test(str)) {
                node.status({fill:"red",shape:"ring",text: "绘制圆形的参数格式填写错误"});
                obj.global_num = -1;
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
                    // node.error(error);
                    node.status({fill:"red",shape:"ring",text: error});
                });
        }
        
// ----------------------------------------------
        /* 1、部署后执行 */
        let obj = {global_num: 0}; // 参数无效时，禁用发送绘图指令(对象是以引用传递到函数内部的)
        let temp_priority = 7;
        let stringList = [node.coord_x, node.coord_y, node.radius, node.line_width];    // 创建一个字符串列表
        // 检验参数的有效性
        stringList.forEach((str, index) => {
            CheckStr(str, obj)
        });

        if (node.set == true) {
            temp_priority = parseInt(node.priority) 
        }else{
            temp_priority = 7
        }

        const uniqueId = uuid.v4(); // 生成唯一ID

        node.status({});

        // 验证自定义比填充色格式
        var F_color = ''
        if(node.fill_color != "custom"){
            F_color = node.fill_color
        }else{
            const regex = /^#[0-9A-Fa-f]{6}$/;
            if (regex.test(node.custom_fill_color)) {
                F_color = node.custom_fill_color
            } else {
                node.status({fill: "red",shape: "ring",text: `自定义填充色格式错误`});
                // F_color = "#FFFFFF"
                obj.global_num = -1
            }
        }

        // 验证自定义边框色格式
        var B_color = ''
        if(node.border_color != "custom"){
            B_color = node.border_color
        }else{
            const regex = /^#[0-9A-Fa-f]{6}$/;
            if (regex.test(node.custom_border_color)) {
                B_color = node.custom_border_color
            } else {
                node.status({fill: "red",shape: "ring",text: `自定义边框色格式错误`});
                // B_color = "#000000"
                obj.global_num = -1
            }
        }


// ----------------------------------------------
        /* 2、触发输入后执行 */
        node.on('input', function(msg) {
            node.status({});

            var postPayload_input = {
                draw_type: 'draw_circle',
                x: parseInt(node.coord_x),
                y: parseInt(node.coord_y),
                radius: parseInt(node.radius),
                line_width: parseInt(node.line_width),
                fill_color: F_color,
                border_color: B_color,
                priority: temp_priority,   // 默认优先级定为7
                id: uniqueId,
            }; 
            console.log(postPayload_input);

            // 验证输入是否含有color字段
            if((msg.payload.hasOwnProperty("circle_fill_color") && msg.payload.hasOwnProperty("circle_border_color"))){
                postPayload_input.fill_color = msg.payload.circle_fill_color;
                postPayload_input.border_color = msg.payload.circle_border_color;
            }

            if(obj.global_num == 0){
                sendHttpRequest('post', url_lcd_draw, postPayload_input, node);
            }
        });

    }

    RED.nodes.registerType("circle", drawCircleFunc);
};



  




