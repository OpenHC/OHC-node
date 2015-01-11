#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var dgram = require('dgram');
var os = require('os');

var Logger = require('./util/logger');
var Rpc = require('./rpc');
var Config = require('./config');
var User_util = require('./util/user');
var Device = require('./device');
var Nrf = require('./nrf24l01');
var Nrf_scheduler = require('./util/nrf-task-scheduler');
var Packet = require('./util/packet.js').Packet;
var Packet_queue = require('./util/packet.js').Packet_queue;

function OHC()
{
	this.logger = new Logger('OHC');
	this.logger.set_devel(Logger.level.debug);
	this.tokens = new Array();
	this.token_length = 32;
	this.devices = new Object();
	this.device_id_by_index = new Array();
	this.num_devices = 0;
	var conf_dir = path.join(__dirname, 'config');
	if(!fs.existsSync(conf_dir))
	{
		fs.mkdirSync(conf_dir, 0750);
	}
	this.conffile_devices = path.join(conf_dir, 'devices.json');
	this.conffile_users = path.join(conf_dir, 'users.json');
	this.conffile = path.join(conf_dir, 'config.json');
	this.load_config();
	this.user_util = new User_util(this);
	this.rf_address = new Buffer(this.config.config.rf.address);
	this.init_rf();
}

OHC.prototype.init_nw_lan = function()
{
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

	var port = this.config.config.lan.port;
	var rpc = new Rpc(this, addr, port);
	var socket = dgram.createSocket('udp4');

	var no_auth_methods = new Array();
	no_auth_methods.push(rpc.get_ip);
	no_auth_methods.push(rpc.login);

	var ohc = this;
	socket.on('message', function(msg, sender) {
		(function(msg, sender) {
			this.logger.log('RX BCAST:', Logger.level.debug);
			this.logger.log('	Message: ' + msg, Logger.level.debug);
			this.logger.log('	Sender: ' + sender.address, Logger.level.debug);
			var json;
			try
			{
				json = JSON.parse(msg);
			}
			catch(ex)
			{
				this.logger.log('	Invalid json: ' + ex);
				return;
			}
			if(typeof json == 'undefined' || json == null)
				return;
			var method = json.method;
			if(typeof method == 'undefined')
				return;
			if(typeof json.rport !== 'number' || json.rport < 1 || json.rport > 65535)
				return;
			this.logger.log('	Method: ' + method, Logger.level.debug);
			if(typeof rpc[method] == 'function')
			{
				var resp = {sucess: false};
				if(no_auth_methods.indexOf(rpc[method]) >= 0 || this.is_session_token_valid(json.session_token))
				{
					this.logger.log('	Calling: rpc.' + method, Logger.level.debug);
					var resp = rpc[method](json);
				}
				else
				{
					this.logger.log('	Unauthorized: Acess denied');
				}
				if(typeof json.transaction_uuid == 'string')
				{
					resp.transaction_uuid = json.transaction_uuid;
				}
				resp.login = this.is_session_token_valid(json.session_token);
				if(typeof resp == 'object')
				{
					resp = JSON.stringify(resp);
					this.logger.log('	Response: ' + resp, Logger.level.debug);
					resp = new Buffer(resp);
					socket.send(resp, 0, resp.length, json.rport, sender.address, function(err, data) {
						(function(err, data)
						{
							if(err)
								this.logger.log("[SOCKET_TX] ERROR: " + err);
							else
								this.logger.log("	Packet send", Logger.level.debug);
						}).call(ohc, err, data);
					});
				}
			}
		}).call(ohc, msg, sender);
	});

	socket.on('error', function(err) {
		(function(err) {
			this.logger.log("[SOCKET] ERROR: " + err);
		}).call(ohc, err);
	});

	socket.on('listening', function() {
		(function() {
			var addr = socket.address();
			console.log('Socket bound to: ' + addr.address + ':' + addr.port);
		}).call(ohc);
	});

	socket.bind(port);
}

OHC.prototype.init_rf = function()
{
	var nrf = new Nrf();
	nrf.get_logger().set_devel(this.logger.get_devel());
	var scheduler = new Nrf_scheduler(nrf);
	var ohc = this;
	scheduler.get_logger().set_devel(nrf.get_logger().get_devel());
	scheduler.add_task(nrf.init);
	scheduler.add_task(nrf.init_module);
	scheduler.add_task(function(callback) {
		nrf.set_channel(ohc.config.config.rf.channel, callback);
	});
	var rx_addr = new Buffer(ohc.rf_address);
	scheduler.add_task(function(callback) {
		nrf.set_rx_address(rx_addr, callback, 1);
	});
	var tx_addr = new Buffer([0x42, 0x42, 0x42, 0x42, 0x42]);
	scheduler.add_task(function(callback) {
		nrf.set_tx_address(tx_addr, callback);
	});
	scheduler.add_task(function(callback) {
		nrf.set_rx_address(tx_addr, callback, 0);
	});
	scheduler.add_task(nrf.init_tx);
	scheduler.run(function() {
		ohc.init_nw_lan.call(ohc);
	});
	this.nrf = nrf;
	nrf.on('irq', function(status) {
		ohc.nrf_irq.call(ohc, status);
	});
	ohc.packet_queue = new Packet_queue();
}

OHC.prototype.load_config = function()
{
	this.conf_devices = new Config(this.conffile_devices);
	this.conf_users = new Config(this.conffile_users);
	this.config = new Config(this.conffile);
	var device_conf = this.conf_devices.config;
	for(var key in device_conf)
	{
		if(device_conf.hasOwnProperty(key))
		{
			this.add_device(key);
		}
	}
}

OHC.prototype.add_device = function(key)
{
	var num_devices_old = this.num_devices;
	if(typeof this.devices[key] == 'undefined')
		this.num_devices++;
	this.devices[key] = new Device(this, key);
	if(this.num_devices > num_devices_old)
		this.device_id_by_index[num_devices_old] = key;
}

OHC.prototype.get_device_id = function(index)
{
	return this.device_id_by_index[index];
}

OHC.prototype.gen_random_str = function(len)
{
    var str = '';
    var charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
    for(var i = 0; i < len; i++)
        str += charset.charAt(Math.floor(Math.random() * charset.length));
    return str;
}

OHC.prototype.login = function(uname, passwd)
{
	if(this.user_util.login(uname, passwd) !== false)
	{
		var token = this.gen_random_str(this.token_length);
		this.tokens.push(token);
		return token;
	}
	return '';
};

OHC.prototype.nrf_irq = function(status)
{
	if(!this.packet_queue.is_empty())
		this.rf_send_packet(this.packet_queue.next());
	this.nrf.clear_irq_flags();
}

OHC.prototype.is_session_token_valid = function(token)
{
	return true;
	return this.tokens.indexOf(token) >= 0 && token.length > 0;
}

OHC.prototype.rf_send_packet = function(packet)
{
	var nrf = this.nrf;
	var ohc = this;
	var scheduler = new Nrf_scheduler(nrf);
	var tx_addr = packet.address;
	scheduler.add_task(function(callback) {
		nrf.set_tx_address(tx_addr, callback);
	});
	scheduler.add_task(function(callback) {
		nrf.set_rx_address(tx_addr, callback, 0);
	});
	scheduler.run(function() {
		nrf.send_data(packet.data, function()
		{
			ohc.logger.log("RF data send", Logger.level.debug);
		});
	});
}

OHC.prototype.remote_write_field = function(field, device)
{
	var data = new Buffer(32);
	data.fill(0);
	this.rf_address.copy(data);
	data[6] = field.id & 0xFF;
	data[7] = field.id >> 8 & 0xFF;
	var len = 0;
	switch(Device.field_types[field.type])
	{
		case 'boolean':
			len = 1;
			data[8] = field.value ? 1 : 0;
			break;
		case 'number':
			len = 8;
			for(var i = 0; i < len; i++)
			{
				data[8 + i] = field.value >> (i * 8) & 0xFF;
			}
			break;
		case 'string':
			return;
			len = field.value.length;
			var buff = new Buffer(field.value);
			buff.copy(data, 8);
	}
	data[5] = len | parseInt('10100000', 2);
	var tx_addr = new Buffer(device.config.addr);
	var packet = new Packet(tx_addr, data);
	if(this.packet_queue.is_empty())
		this.rf_send_packet(packet);
	else
		this.packet_queue.push(packet);
}

new OHC();
