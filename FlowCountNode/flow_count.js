
module.exports = function(RED) {

    function FlowCountNodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.num_Init = config.num_Init
        node.set = config.set

        var count = 0;


        const pattern = /^[0-9]+$/;
        const isAllDigits = pattern.test(node.num_Init);  // 为真表示字符串全为数字组成

        // 若勾选了引脚电平初始化
        if (node.set == true && isAllDigits) {
            count = parseInt(node.num_Init)
            msg = {'topic': "", 'payload': node.num_Init}
            node.status({fill: "green",shape: "ring",text: `当前计数：${count}`});
            node.send(msg);
        }

    
        node.on('input', function(msg) {
          count++; // 计数自加
    
          msg.payload = count; // 将计数值添加到消息中
          node.status({fill: "green",shape: "ring",text: `当前计数：${count}`});
    
          node.send(msg); // 将消息发送到下游节点
        });
    
        node.on('close', function() {
          count = 0; // 重新部署后计数置零
        });
    }


    RED.nodes.registerType("Flow Count", FlowCountNodeFunc);
};



