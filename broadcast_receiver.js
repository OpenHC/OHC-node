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

var no_auth_methods = new Array();
no_auth_methods.push(rpc.get_ip);
no_auth_methods.push(rpc.login);

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
	if(typeof json.rport !== 'number' || json.rport < 1 || json.rport > 65535)
		return;
	console.log('	Method: ' + method);
	if(typeof rpc[method] == 'function')
	{
		var resp = {sucess: false};
		if(no_auth_methods.indexOf(rpc[method]) >= 0 || ohc.is_session_token_valid(json.session_token))
		{
			console.log('	Calling: rpc.' + method);
			var resp = rpc[method](json);
		}
		else
		{
			console.log('	Unauthorized: Acess denied');
		}
		if(typeof json.transaction_uuid == 'string')
		{
			resp.transaction_uuid = json.transaction_uuid;
		}
		resp.login = ohc.is_session_token_valid(json.session_token);
		if(typeof resp == 'object')
		{
			resp = JSON.stringify(resp);
			console.log('	Response: ' + resp);
			resp = new Buffer(resp);
			socket.send(resp, 0, resp.length, json.rport, sender.address, function(err, data) {
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