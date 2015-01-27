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

rpc.prototype.set_device_name = function(json)
{	
	var resp = new Object();
	resp.method = 'set_device_name_done';
	resp.sucess = false;
	if(typeof json.id !== 'string')
		return resp;
	resp.id = json.id;
	if(typeof this.ohc.devices[json.id] == 'undefined')
		return resp;
	if(typeof json.name !== 'string')
		return resp;
	this.ohc.devices[json.id].set_name(json.name);
	resp.sucess = true;
	return resp;
}

rpc.prototype.device_set_field_value = function(json)
{
	var resp = new Object();
	resp.method = 'device_set_field_done';
	resp.sucess = false;
	if(typeof json.value == 'undefined')
		return resp;
	if(typeof json.device_id !== 'string')
		return resp;
	resp.device_id = json.device_id;
	if(typeof this.ohc.devices[json.device_id] == 'undefined')
		return resp;
	if(typeof json.field_id !== 'number')
		return resp;
	resp.field_id = json.field_id;
	var field = this.ohc.devices[json.device_id].get_field(json.field_id);
	if(typeof field == 'undefined')
		return resp;
	if(typeof field.writable == 'undefined' || field.writable == false)
	{
		return resp;
	}
	else
	{
		resp.sucess = this.ohc.devices[json.device_id].set_field_value(json.field_id, json.value);
	}
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
