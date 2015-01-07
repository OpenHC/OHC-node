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

module.exports = rpc;