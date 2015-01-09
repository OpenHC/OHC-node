var fs = require('fs');
var path = require('path');
var Config = require('./config');
var User_util = require('./user_util');
var Device = require('./device');

function OHC()
{
	this.tokens = new Array();
	this.token_length = 32;
	this.devices = new Object();
	this.device_id_by_index = new Array();
	this.num_devices = 0;
	this.conf_dir = path.join(__dirname, 'config');
	if(!fs.existsSync(this.conf_dir))
	{
		fs.mkdirSync(this.conf_dir, 0750);
	}
	this.conffile_devices = path.join(__dirname, 'config', 'devices.json');
	this.conffile_users = path.join(__dirname, 'config', 'users.json');
	this.load_config();
	this.user_util = new User_util(this);
}

OHC.prototype.load_config = function()
{
	this.conf_devices = new Config(this.conffile_devices);
	this.conf_users = new Config(this.conffile_users);
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
};

OHC.prototype.is_session_token_valid = function(token)
{
	return this.tokens.indexOf(token) >= 0;
}

module.exports = OHC;
