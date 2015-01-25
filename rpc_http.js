function rpc(ohc)
{
	this.ohc = ohc;
	this.no_auth_methods = new Array();
	this.no_auth_methods.push(this.login);
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
