function rpc(ohc)
{
	this.ohc = ohc;
	this.no_auth_methods = new Array();
	this.no_auth_methods.push(this.login);
}

rpc.prototype.get_device_ids = function(json)
{
	var resp = new Object();
	resp.method = 'set_device_ids';
	resp.ids = this.ohc.get_device_ids();
	resp.success = true;
	return resp;
}

rpc.prototype.get_device_by_id = function(json)
{
	var resp = new Object();
	resp.method = 'set_device';
	resp.sucess = false;
	if(typeof json.id !== 'string')
		return resp;
	resp.id = json.id;
	var device = this.ohc.devices[json.id];
	if(typeof device == 'undefined')
		return resp;
	resp.device = device.get_safe_repr();
	resp.sucess = true;
	return resp;
}

rpc.prototype.login = function(json)
{
	var resp = new Object();
	resp.success = false;
	var uname = json.uname;
	var passwd = json.passwd;
	if(typeof uname != 'string' || typeof passwd != 'string')
		return resp;
	var resp = new Object();
	var token = this.ohc.login(uname, passwd);
	resp.method = 'set_session_token';
	resp.session_token = token;
	resp.success = token.length > 0;
	return resp;
}

module.exports = rpc;
