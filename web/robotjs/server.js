var childProcess = require('child_process')
  , express = require('express')
  , http = require('http')
  , morgan = require('morgan')
  , ws = require('ws');

// configuration files
var configServer = require('./lib/config/server');
var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/ttyMFD1", {baudrate: 115200});
serialPort.open(function (error) {
  if ( error ) {
    console.log('failed to open: '+error);
  } else {
    console.log('open');
    serialPort.on('data', function(data) {
      //console.log('data received: ' + data);
    });
  }
});
var JOYSTICK = 5;
var SERVO = 11;
function runSpeed(leftSpeed,rightSpeed){
	var bin = new Buffer([ 0xff, 0x55, 0x7, 0x0, 0x2, JOYSTICK,0,0,0,0]);
	bin.writeInt16LE(leftSpeed,6);
	bin.writeInt16LE(rightSpeed,8);
    serialPort.write(bin, function(err, results){
		console.log("result:"+results);
	});
}
function forward(){
	runSpeed(-100,-100);
};
function backward(){
	runSpeed(100,100);
};
function turnleft(){
	runSpeed(100,-100);
};
function turnright(){
	runSpeed(-100,100);
};
function doStop(){
	runSpeed(0,0);
};
function runServo(angle){
	angle = 90+Math.floor(angle/1.5);
	var bin = new Buffer([ 0xff, 0x55, 0x6, 0x0, 0x2, SERVO, 0x6, 0x1, angle]);
    serialPort.write(bin, function(err, results){
		console.log("result:"+results);
	});
};
var app = express();
app.set('port', configServer.httpPort);
app.use(express.static(configServer.staticFolder));
app.use(morgan('dev'));
app.post('/post', function (req, res) {
	if(req.query.release!=undefined){
		doStop();
	}
	if(req.query.press!=undefined){
		switch(req.query.press){
			case "0":{
				forward();
			}
			break;
			case "1":{
				backward();
			}
			break;
			case "2":{
				turnleft();
			}
			break;
			case "3":{
				turnright();
			}
			break;
		}
	}
	if(req.query.angle!=undefined){
		runServo(req.query.angle);
	}
	if(req.query.reset!=undefined){
		resetStream();
	}
    res.send('ok');
});

// serve index
require('./lib/routes').serveIndex(app, configServer.staticFolder);

// HTTP server
http.createServer(app).listen(app.get('port'), function () {
  console.log('HTTP server listening on port ' + app.get('port'));
});
var STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes
var width = 640;
var height = 480;

// WebSocket server
var wsServer = new (ws.Server)({ port: configServer.wsPort });
console.log('WebSocket server listening on port ' + configServer.wsPort);

wsServer.on('connection', function(socket) {
  // Send magic bytes and video size to the newly connected socket
  // struct { char magic[4]; unsigned short width, height;}
  var streamHeader = new Buffer(8);

  streamHeader.write(STREAM_MAGIC_BYTES);
  streamHeader.writeUInt16BE(width, 4);
  streamHeader.writeUInt16BE(height, 6);
  socket.send(streamHeader, { binary: true });

  console.log('New WebSocket Connection (' + wsServer.clients.length + ' total)');

  socket.on('close', function(code, message){
    console.log('Disconnected WebSocket (' + wsServer.clients.length + ' total)');
  });
});

wsServer.broadcast = function(data, opts) {
  for(var i in this.clients) {
    if(this.clients[i].readyState == 1) {
      this.clients[i].send(data, opts);
    }
    else {
      console.log('Error: Client (' + i + ') not connected.');
    }
  }
};
function resetStream(){
	childProcess.exec('../../bin/do_ffmpeg.sh');
};
// HTTP server to accept incoming MPEG1 stream
http.createServer(function (req, res) {
  console.log(
    'Stream Connected: ' + req.socket.remoteAddress +
    ':' + req.socket.remotePort + ' size: ' + width + 'x' + height
  );

  req.on('data', function (data) {
    wsServer.broadcast(data, { binary: true });
  });
}).listen(configServer.streamPort, function () {
  console.log('Listening for video stream on port ' + configServer.streamPort);

  // Run do_ffmpeg.sh from node                                                   
  childProcess.exec('/home/root/edi-cam/bin/do_ffmpeg.sh');
});

module.exports.app = app;