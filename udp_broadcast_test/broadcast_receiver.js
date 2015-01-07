#!/opt/node/bin/node

var dgram = require('dgram');
var os = require('os');

var Rpc = require('./rpc');
var OHC = require('./ohc');

var interfaces = os.networkInterfaces();

var addr = null;

Object.keys(interfaces).forEach(function (ifname) {
	interfaces[ifname].forEach(function (iface) {
		if (iface.family != 'IPv4' || iface.internal)
		{
		  return;
		}
		addr = iface.address
	});
});

console.log("I'm @ " + addr);

var port = 4242;

var ohc = new OHC();

var rpc = new Rpc(ohc, addr, port);

var socket = dgram.createSocket('udp4');

socket.on('message', function(msg, sender) {
	console.log('RX BCAST:');
	console.log('	Message: ' + msg);
	console.log('	Sender: ' + sender.address);
	var json;
	try
	{
		json = JSON.parse(msg);
	}
	catch(ex)
	{
		console.log(' Invalid json: ' + ex);
		return;
	}
	if(typeof json == 'undefined' || json == null)
		return;
	var method = json.method;
	if(typeof method == 'undefined')
		return;
	console.log('	Method: ' + method);
	if(typeof rpc[method] == 'function')
	{
		console.log('	Calling: rpc.' + method);
		var resp = rpc[method](json);
		if(typeof resp == 'object')
		{
			resp = JSON.stringify(resp);
			console.log('	Response: ' + resp);
			resp = new Buffer(resp);
			socket.send(resp, 0, resp.length, rpc.rport, sender.address, function(err, data) {
				if(err)
					console.log("[SOCKET_TX] ERROR: " + err);
				else
					console.log("	Packet send");
			});
		}
	}
});

socket.on('error', function(err) {
	console.log("[SOCKET] ERROR: " + err);
});

socket.on('listening', function() {
	var addr = socket.address();
	console.log('socket bound to: ' + addr.address + ':' + addr.port);
});

socket.bind(port);