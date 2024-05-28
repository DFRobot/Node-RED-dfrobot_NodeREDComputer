
module.exports = function(RED) {

    function FlowSwitch_NodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.set = config.set
        node.flowSwitch = config.flowSwitch

        var switch_arg = false; // 初始化开关参数：默认关闭

        if (node.set == true ) {
          if(node.flowSwitch == 'on'){
            switch_arg = true
            node.status({fill: "black",shape: "ring",text: `流开关：打开`});
          }else{
            switch_arg = false
            node.status({fill: "black",shape: "ring",text: `流开关：关闭`});
          }
        }else{
          node.status({fill: "black",shape: "ring",text: `流开关：关闭`});
        }

        node.on('input', function(msg) {
          if(msg.payload.hasOwnProperty('switch')){
            if(msg.payload.switch == 'on'){
              switch_arg = true
              node.status({fill: "black",shape: "ring",text: `流开关：打开`});
            }else if(msg.payload.switch == 'off'){
              switch_arg = false
              node.status({fill: "black",shape: "ring",text: `流开关：关闭`});
            }else{
              switch_arg = false
              node.status({fill: "black",shape: "ring",text: `流开关：参数错误, msg.payload.switch中应为on/off, 当前流开关状态默认置为关闭`});
            }
            return
          }

          if(switch_arg == true){
            node.send(msg); // 将消息发送到下游节点
          }
          
        });
    
        node.on('close', function() {
          switch_arg = false // 重新部署后开关复原：默认关闭
        });
    }


    RED.nodes.registerType("流开关", FlowSwitch_NodeFunc);
};



