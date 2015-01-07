var fs = require('fs');
var path = require('path');
var Config = require('./config');
var User_util = require('./user_util');

function OHC()
{
	this.tokens = new Array();
	this.token_length = 32;
	this.conf_dir = path.join(__dirname, 'config');
	if(!fs.existsSync(this.conf_dir))
	{
		fs.mkdirSync(this.conf_dir, 0750);
	}
	this.conffile_devices = path.join(__dirname, 'config', 'devices.json');
	this.conffile_users = path.join(__dirname, 'config', 'users.json');
	this.load_config();
	this.user_util = new User_util(this);
	this.user_util.user_add('tobias', 'tobias');
}

OHC.prototype.load_config = function()
{
	this.conf_devices = new Config(this.conffile_devices);
	this.conf_users = new Config(this.conffile_users);
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

module.exports = OHC;