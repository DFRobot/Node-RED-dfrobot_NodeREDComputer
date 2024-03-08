
module.exports = function(RED) {

    function FlowCountNodeFunc(config) {
        RED.nodes.createNode(this, config);
        var node = this;

    }


    RED.nodes.registerType("GW TEST", FlowCountNodeFunc);
};



