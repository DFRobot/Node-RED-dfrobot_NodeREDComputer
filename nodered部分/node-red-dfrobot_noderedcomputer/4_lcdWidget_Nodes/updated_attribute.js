
global.global_num = 0;

module.exports = function(RED) {

    function updateAttrFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
 
        node.background_color = config.background_color           
        node.line_color = config.line_color          
        node.rect_border_color = config.rect_border_color            
        node.rect_fill_color = config.rect_fill_color    
        node.circle_border_color = config.circle_border_color
        node.circle_fill_color = config.circle_fill_color
        node.text_color = config.text_color
        node.graphic_options = config.graphic_options       

        /* 2、触发输入后执行 */
        node.on('input', function(msg) {
            // if(node.graphic_options == "background"){
            //     msg = {topic: "update_color", payload: {background_color: node.background_color}}
            //     node.send(msg)
            // }else if(node.graphic_options == "line"){
            //     msg = {topic: "update_color", payload: {line_color: node.line_color}}
            //     node.send(msg)
            // }else if(node.graphic_options == "rect"){
            //     msg = {topic: "update_color", payload: {rect_border_color: node.rect_border_color, rect_fill_color: node.rect_fill_color}}
            //     node.send(msg)
            // }else if(node.graphic_options == "circle"){
            //     msg = {topic: "update_color", payload: {circle_border_color: node.circle_border_color, circle_fill_color: node.circle_fill_color}}
            //     node.send(msg)
            // }else if(node.graphic_options == "text"){
            //     msg = {topic: "update_color", payload: {text_color: node.text_color}}
            //     node.send(msg)
            // }

            if(node.graphic_options == "background"){
                // msg = {topic: "update_color", payload: {background_color: node.background_color}}
                msg.payload['background_color'] = node.background_color
                node.send(msg)
            }else if(node.graphic_options == "line"){
                // msg = {topic: "update_color", payload: {line_color: node.line_color}}
                msg.payload['line_color'] = node.line_color
                node.send(msg)
            }else if(node.graphic_options == "rect"){
                // msg = {topic: "update_color", payload: {rect_border_color: node.rect_border_color, rect_fill_color: node.rect_fill_color}}
                msg.payload['rect_border_color'] = node.rect_border_color
                msg.payload['rect_fill_color'] = node.rect_fill_color
                node.send(msg)
            }else if(node.graphic_options == "circle"){
                // msg = {topic: "update_color", payload: {circle_border_color: node.circle_border_color, circle_fill_color: node.circle_fill_color}}
                msg.payload['circle_border_color'] = node.circle_border_color
                msg.payload['circle_fill_color'] = node.circle_fill_color
                node.send(msg)
            }else if(node.graphic_options == "text"){
                // msg = {topic: "update_color", payload: {text_color: node.text_color}}
                msg.payload['text_color'] = node.text_color
                node.send(msg)
            }
        });

    }

    RED.nodes.registerType("更改属性", updateAttrFunc);
};



  




