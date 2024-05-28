
module.exports = function(RED) {

    function FlowCount_NodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.num_Init = config.num_Init
        node.set = config.set

        var count = 0;

        const pattern = /^[0-9]+$/;
        const isAllDigits = pattern.test(node.num_Init);  

        // 勾选了初始计数
        if (node.set == true && isAllDigits) {
            count = parseInt(node.num_Init)
            msg = {'topic': "", 'payload': node.num_Init}
            node.status({fill: "green",shape: "ring",text: `当前计数：${count}`});
        }
    
        node.on('input', function(msg) {
          count++; 
          let message = {"topic":"Flow Count", "payload": {"current_count": count, "current_data":{"topic": msg.topic, "payload": msg.payload}}}
          node.status({fill: "green",shape: "ring",text: `当前计数：${count}`});
          node.send(message); 
        });
    
        node.on('close', function() {
          count = 0; // 重新部署后计数置零
        });
    }


    RED.nodes.registerType("流计数", FlowCount_NodeFunc);
};



