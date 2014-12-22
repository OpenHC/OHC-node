function Command(bincmd, needs_param, needs_data)
{
	this.cmd = bincmd;
	if(typeof needs_param == 'undefined')
		needs_param = false;
	if(typeof needs_data == 'undefined')
		needs_data = false;
	if(needs_data && needs_param)
		this.exec = Command.func_exec_param_data;
	else if(needs_data)
		this.exec = Command.func_exec_data;
	else if(needs_param)
		this.exec = Command.func_exec_param;
	else
		this.exec = Command.func_exec;
}

Command.func_exec = function()
{

}

Command.func_exec_data = function(data)
{

}

Command.func_exec_param = function(param)
{

}

Command.func_exec_param_data = function(param, data)
{

}

var commands = new Object();
commands.r_register				= new Command(parseInt('00000000', 2), true, true);
commands.w_register				= new Command(parseInt('00100000', 2), true, true);
commands.r_rx_payload			= new Command(parseInt('01100001', 2), false, true);
commands.w_tx_payload			= new Command(parseInt('01100000', 2), false, true);
commands.flush_tx				= new Command(parseInt('11100001', 2), false, false);
commands.flush_rx				= new Command(parseInt('11100010', 2), false, false);
commands.reuse_tx_pl			= new Command(parseInt('11100011', 2), false, false);
commands.r_rx_pl_wid			= new Command(parseInt('01100000', 2), false, true);
commands.w_ack_payload			= new Command(parseInt('10101000', 2), true, true);
commands.w_tx_payload_no_ack	= new Command(parseInt('10110000', 2), false, true);
commands.nop					= new Command(parseInt('11111111', 2), false, false);

module.exports = commands;