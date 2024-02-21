
module.exports = function(RED) {

    function GPIO_IN_FUNC(config) {
        RED.nodes.createNode(this, config);
        var node = this;


        const { spawn } = require('child_process');

        // 启动Python脚本
        const pythonProcess = spawn('python', ['F:\\demo_loop.py']);

        // 监听标准输出
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python Output: ${data}`);
        });

        // 监听标准错误输出
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });

        // 监听进程退出事件
        pythonProcess.on('close', (code) => {
            console.log(`Child process exited with code ${code}`);
        });

  
    }


    RED.nodes.registerType("GPIO In", GPIO_IN_FUNC);
};



// module.exports = function(RED) {
//     function WebSocketClientNode(config) {
//         RED.nodes.createNode(this, config);
//         var node = this;

//         const io = require('socket.io-client');
//         const socket = io('http://10.1.2.3:5000');
        
//         socket.on('connect', () => {
//           console.log('Connected to server');
//         });
        
//         socket.on('message', (data) => {
//           console.log('Received server message:', data);
//         });
        
//         socket.on('disconnect', () => {
//           console.log('Disconnected from server');
//         });
        
//         socket.emit('client_msg', { message: 'Hello server' });
        
//     }
//     RED.nodes.registerType("GPIO In", WebSocketClientNode);
// }

// module.exports = function(RED) {
//     function WebSocketClientNode(config) {
//         RED.nodes.createNode(this, config);
//         var node = this;

//         const io = require('socket.io-client');

//         // const socket = io('http://10.1.2.3:5000');
//         const socket = io('ws://10.1.2.3:5000', {
//             transports: ['websocket']
//         });
        
//         socket.on('connect', function() {
//             console.log('Connected to WebSocket server!');
//             socket.emit('message', { key1: 'value1', key2: 'value2' });

//             // ws.send(JSON.stringify({"Pin": 80, "Interrupt": "both", "Mode": "rising"}));
//             // socket.emit('message', 'Hello,world');
//             // socket.emit('connect', 'connect-Hello,world');
            
//         });
        


//         socket.on('message', (arg) => {
//             console.log('received!');
//             console.log(arg); // world
//           });

//         socket.on('disconnect', function() {
//             console.log('Disconnected from WebSocket server!');
//         });
        
//     }
//     RED.nodes.registerType("GPIO In", WebSocketClientNode);
// }