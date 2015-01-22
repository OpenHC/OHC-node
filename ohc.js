#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var dgram = require('dgram');
var os = require('os');

var Logger = require('./util/logger');
var Rpc_udp = require('./rpc_udp');
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
	this.logger.set_devel(Logger.level.info);
	this.tokens = new Array();
	this.token_length = 32;
	this.devices = new Object();
	this.device_id_by_index = new Array();
	this.num_devices = 0;
	var conf_dir = path.join(__dirname, 'config');
	if(!fs.existsSync(conf_dir)) //Crreate config dir if not exists
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
	this.nrf_busy = false;
}

OHC.prototype.check_tx_queue = function() //Helper function to resume queue if interrupt is missed for some reason
{
	if(this.packet_queue.queue.length > 0 && !this.nrf_busy)
	{
		this.rf_send_packet(this.packet_queue.next());
	}
	setTimeout(function(ohc) {
		return function() {
			ohc.check_tx_queue();
		}
	}(this), 50);
}

OHC.prototype.init_nw_lan = function() //Sets up udp listener for broadcasts and json rpcs
{
	var interfaces = os.networkInterfaces();

	var addr = null;

	Object.keys(interfaces).forEach(function (ifname) {
		interfaces[ifname].forEach(function (iface) {
			if (iface.family != 'IPv4' || iface.internal)
			{
				return;
			}
			addr = iface.address; //Get address of ethernet interface
		});
	});

	this.logger.log("I'm @ " + addr, Logger.level.info);

	var port = this.config.config.lan.port;
	var rpc_udp = new Rpc_udp(this, addr, port);
	var socket = dgram.createSocket('udp4');

	var no_auth_methods = new Array();
	no_auth_methods.push(rpc_udp.get_ip);
	no_auth_methods.push(rpc_udp.login);

	var ohc = this;
	socket.on('message', function(msg, sender) { //Listen for udp packets
		(function(msg, sender) {
			this.logger.log('RX BCAST:', Logger.level.debug);
			this.logger.log('	Message: ' + msg, Logger.level.debug);
			this.logger.log('	Sender: ' + sender.address, Logger.level.debug);
			var json;
			try
			{
				json = JSON.parse(msg);
			}
			catch(ex) //Prevent gateway from crashing due to invalid input
			{
				this.logger.log('	Invalid json: ' + ex);
				return;
			}
			if(typeof json == 'undefined' || json == null)
				return;
			var method = json.method;
			if(typeof method == 'undefined')
				return;
			//Check if response port is valid
			if(typeof json.rport !== 'number' || json.rport < 1 || json.rport > 65535)
				return;
			this.logger.log('	Method: ' + method, Logger.level.debug);
			if(typeof rpc_udp[method] == 'function')
			{
				var resp = {sucess: false};
				//Check if method requires authorization and check if client is authorized
				if(no_auth_methods.indexOf(rpc_udp[method]) >= 0 || this.is_session_token_valid(json.session_token))
				{
					this.logger.log('	Calling: rpc.' + method, Logger.level.debug);
					var resp = rpc_udp[method](json);
				}
				else
				{
					this.logger.log('	Unauthorized: Acess denied');
				}
				//Include transaction id in response if request is a transaction
				if(typeof json.transaction_uuid == 'string')
				{
					resp.transaction_uuid = json.transaction_uuid;
				}
				//Inform client if its login session is still valid
				resp.login = this.is_session_token_valid(json.session_token);
				if(typeof resp == 'object')
				{
					//Return response as a stringified json object
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
			this.logger.log('Socket bound to: ' + addr.address + ':' + addr.port, Logger.level.info);
		}).call(ohc);
	});

	socket.bind(port);
}

//Setup wireless module
OHC.prototype.init_rf = function()
{
	var nrf = new Nrf();
	nrf.get_logger().set_devel(this.logger.get_devel());
	var scheduler = new Nrf_scheduler(nrf);
	var ohc = this;
	scheduler.get_logger().set_devel(nrf.get_logger().get_devel());
	//write sensible defaults to nrf registers
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
	//Initialize queue for packets transmitted via nrf
	ohc.packet_queue = new Packet_queue();
}

OHC.prototype.load_config = function()
{
	this.conf_devices = new Config(this.conffile_devices);
	this.conf_users = new Config(this.conffile_users);
	this.config = new Config(this.conffile);
	var device_conf = this.conf_devices.config;
	//Store devices sorted by their address
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
	//Check status flags
	var is_max_rt = status.max_rt.value[0] > 0;
	var is_tx_ds = status.tx_ds.value[0] > 0;
	var scheduler = new Nrf_scheduler(this);
	if(status.max_rt.value[0] > 0)
		scheduler.add_task(function(callback){
			this.nrf.flush_tx(callback);
		});
	scheduler.add_task(function(callback) {
			this.nrf.clear_irq_flags(callback);
		});
	scheduler.run(function() {
		//Send next packet
		if(!this.packet_queue.is_empty())
			this.rf_send_packet(this.packet_queue.next());
		//Unset busy flag if module indicates data has been processed
		else if(is_tx_ds || is_max_rt)
			this.nrf_busy = false;
		});
}

OHC.prototype.is_session_token_valid = function(token)
{
	return this.tokens.indexOf(token) >= 0 && token.length > 0;
}

//Set tx address and send data
OHC.prototype.rf_send_packet = function(packet)
{
	this.nrf_busy = true;
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

//Set field on remote device
OHC.prototype.remote_write_field = function(device_id, field, device)
{
	var data = new Buffer(32);
	data.fill(0);
	this.rf_address.copy(data);
	//Write field index to packet
	data[6] = field.id & 0xFF;
	data[7] = field.id >> 8 & 0xFF;
	var len = 0;
	//Shift in data depending on the fields data type
	switch(Device.field_types[field.type])
	{
		case 'boolean':
			len = 1;
			data[8] = field.value ? 1 : 0;
			break;
		case 'number':
			len = field.length;
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
	//Include content size information and set static flags (beta)
	data[5] = len | parseInt('10100000', 2);
	var tx_addr = new Buffer(device.config.addr);
	var packet = new Packet(tx_addr, data);
	//Enqueue data if module is busy
	if(this.nrf_busy)
	{
		this.packet_queue.push(device_id, field.id, packet);
		//Drop redundant packets that set the same field
		this.packet_queue.descramble();
	}
	else
		this.rf_send_packet(packet);
}

new OHC();
