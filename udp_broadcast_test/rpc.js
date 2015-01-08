function rpc(ohc, ip_addr, port)
{
	this.ohc = ohc;
	this.lport = port;
	this.ip_addr = ip_addr;
}

rpc.prototype.get_ip = function(json)
{
	var port = json.port;
	if(typeof port != 'number')
		return;
	this.rport = port;
	var resp = new Object();
	resp.method = 'set_ip_address';
	resp.ip_address = this.ip_addr;
	resp.port = this.lport;
	return resp;
}

rpc.prototype.login = function(json)
{
	var uname = json.uname;
	var passwd = json.passwd;
	if(typeof uname != 'string' || typeof passwd != 'string')
		return;
	var resp = new Object();
	var token = this.ohc.login(uname, passwd);
	resp.method = 'set_session_token';
	resp.session_token = token;
	resp.success = (typeof token == 'string');
	return resp;
}

rpc.prototype.get_num_devices = function(json)
{
	var resp = new Object();
	resp.success = true;
	resp.method = 'set_num_devices';
	resp.ids = ohc.num_devices;
	return resp;
}

rpc.prototype.get_device_id = function(json)
{
	var resp = new Object();
	resp.success = false;
	if(typeof json.index !== 'number')
		return resp;
	resp.index = json.index;
	resp.method = 'set_device_id';
	resp.id = ohc.get_device_id(json.index);
	resp.success = true;
	return resp;
}

rpc.prototype.device_get_num_fields = function(json)
{	
	var resp = new Object();
	resp.method = 'set_num_fields';
	resp.sucess = false;
	if(typeof json.id !== 'number')
		return resp;
	resp.id = json.id;
	if(typeof ohc.devices[json.id] == 'undefined')
		return resp;
	resp.num_fields = ohc.devices[json.id].get_num_fields();
	resp.sucess = true;
	return resp;
}

rpc.prototype.device_get_name = function(json)
{	
	var resp = new Object();
	resp.method = 'device_set_name';
	resp.sucess = false;
	if(typeof json.id !== 'number')
		return resp;
	resp.id = json.id;
	if(typeof ohc.devices[json.id] == 'undefined')
		return resp;
	resp.name = ohc.devices[json.id].get_name();
	resp.sucess = true;
	return resp;
}

rpc.prototype.device_set_name = function(json)
{	
	var resp = new Object();
	resp.method = 'device_set_name_done';
	resp.sucess = false;
	if(typeof json.id !== 'number')
		return resp;
	resp.id = json.id;
	if(typeof ohc.devices[json.id] == 'undefined')
		return resp;
	if(typeof json.name !== 'string')
		return resp;
	ohc.devices[json.id].set_name(json.name);
	resp.sucess = true;
	return resp;
}

rpc.prototype.device_get_field = function(json)
{
	var resp = new Object();
	resp.method = 'device_set_field';
	resp.sucess = false;
	if(typeof json.device_id !== 'number')
		return resp;
	resp.device_id = json.device_id;
	if(typeof ohc.devices[json.device_id] == 'undefined')
		return resp;
	if(typeof json.field_id !== 'number')
		return resp;
	resp.field_id = json.field_id;
	var field = ohc.devices[json.device_id].get_field(json.field_id);
	if(typeof field == 'undefined')
		return resp;
	if(typeof field.readable == 'undefined' || field.readable == false)
	{
		return resp;
	}
	else
	{
		resp.field = field;
	}
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
	if(typeof json.device_id !== 'number')
		return resp;
	resp.device_id = json.device_id;
	if(typeof ohc.devices[json.device_id] == 'undefined')
		return resp;
	if(typeof json.field_id !== 'number')
		return resp;
	resp.field_id = json.field_id;
	var field = ohc.devices[json.device_id].get_field(json.field_id);
	if(typeof field == 'undefined')
		return resp;
	if(typeof field.writable == 'undefined' || field.writable == false)
	{
		return resp;
	}
	else
	{
		resp.sucess = ohc.devices[json.device_id].set_field_value(json.field_id, json.value);
	}
	return resp;
}

module.exports = rpc;