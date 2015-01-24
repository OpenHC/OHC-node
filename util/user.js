var crypto = require('crypto');

function Util(ohc, salt_len)
{
	this.ohc = ohc;
	if(typeof salt_len == 'undefined')
		salt_len = 16;
	this.salt_len = salt_len;
}

Util.prototype.user_add = function(uname, passwd)
{
	uname = uname.toLowerCase();
	if(typeof this.ohc.conf_users.config[uname] !== 'undefined')
		return false;
	var conf_user = new User();
	conf_user.uname = uname;
	conf_user.failed_logins = 0;
	var hash = crypto.createHash('sha256');
	conf_user.salt = this.ohc.gen_random_str(this.salt_len);
	hash.update(passwd + conf_user.salt, 'utf8');
	conf_user.passwd = hash.digest('hex');
	this.ohc.conf_users.config[uname] = conf_user;
	this.ohc.conf_users.save();
	return conf_user;
}

Util.prototype.user_rm = function(uname)
{
	uname = uname.toLowerCase();
	if(typeof this.ohc.conf_users.config[uname] === 'undefined')
		return false;
	this.ohc.conf_users.config[uname] = undefined;
	this.ohc.conf_users.save();
	return true;
}

Util.prototype.user_exists = function(uname)
{
	uname = uname.toLowerCase();
	return typeof this.ohc.conf_users.config[uname] !== 'undefined';
}

Util.prototype.verify_passwd = function(uname, passwd)
{
	uname = uname.toLowerCase();
	var conf_user = this.ohc.conf_users.config[uname];
	if(typeof conf_user === 'undefined')
		return false;
	var hash = crypto.createHash('sha256');
	hash.update(passwd + conf_user.salt, 'utf8');
	if(conf_user.passwd === hash.digest('hex'))
	{
		return conf_user;
	}
	return false;
}

Util.prototype.login = function(uname, passwd)
{
	uname = uname.toLowerCase();
	var conf_user = this.verify_passwd(uname, passwd);
	if(conf_user !== false)
	{
		conf_user.failed_logins = 0;
		this.ohc.conf_users.save();
	}
	else if(this.user_exists(uname))
	{
		this.ohc.conf_users.config[uname].failed_logins++;
		this.ohc.conf_users.save();
	}
	return conf_user;
}

Util.prototype.change_passwd = function(uname, passwd)
{
	uname = uname.toLowerCase();
	var conf_user = this.ohc.conf_users.config[uname];
	if(typeof conf_user === 'undefined')
		return false;
	var hash = crypto.createHash('sha256');
	conf_user.salt = this.ohc.gen_random_str(this.salt_len);
	hash.update(passwd + conf_user.salt, 'utf8');
	conf_user.passwd = hash.digest('hex');
	this.ohc.conf_users.save();
	return conf_user;
}

function User()
{

}

module.exports = Util;
