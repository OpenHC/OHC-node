function OHC()
{
	this.tokens = new Array();
	this.token_length = 32;
}

OHC.prototype.gen_token = function()
{
    var token = "";
    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    for(var i = 0; i < this.token_length; i++)
        token += charset.charAt(Math.floor(Math.random() * charset.length));
    return token;
}

OHC.prototype.login = function(uname, passwd)
{
	var token = this.gen_token();
	this.tokens.push(token);
	return token;
};

module.exports = OHC;