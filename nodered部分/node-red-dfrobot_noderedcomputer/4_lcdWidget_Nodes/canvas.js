module.exports = function(RED) {
    function CustomHtmlNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
            // 在这里可以添加处理消息的逻辑，如果需要的话
            node.send(msg);
        });
    }
    RED.nodes.registerType("canvas",CustomHtmlNode);
}
