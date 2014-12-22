require('./buffer')

function Register(addr, fields, length)
{
	this.addr = addr;
	if(typeof fields == 'undefined')
		fields = {};
	this.fields = fields;
	this.recalc_fields();
	if(typeof length == 'undefined')
		length = 1;
	this.length = length;
}

Register.prototype.recalc_fields = function()
{
	for(var key in this.fields)
		if(this.fields.hasOwnProperty(key))
			this[key] = this.fields[key];
}

Register.prototype.get_value = function()
{
	var value = new Buffer(this.length);
	value.fill(0);
	for(var i = 0; i < this.value.length; i++)
	{
		for(var j = 0; j < this.fields.length; j++)
		{
			var field_val = this.fields[j].get_value();
			if(field_val.length > i)
			{
				value[i] |= field_val[i];
			}
		}
	}
	return value;
}

function Bitfield(begin, end, value) //Index starts @ 0!
{
	this.begin = begin;
	this.end = end;
	this.first_byte = Math.floor(this.begin / 8);
	this.last_byte = Math.floor(this.end / 8);
	this.value = new Buffer(this.last_byte + 1);
	if(typeof value != 'undefined')
		this.set_value(value);
	else
		this.value.fill(0);
}

Bitfield.prototype.set_value = function(value)
{
	if(typeof value == 'number')
	{
		var actual_val = (value << this.begin) & ((2 << this.end) - 1);
		for (var i = 0; i < this.value.length; i++)
		{
			this.value[i] = (actual_val >> i) & 0xFF;
		}
	}
	else
	{
		this.value = value.bshiftr(this.begin);
	}
}

Bitfield.prototype.get_value = function()
{
	return this.value;
}

function Registerset()
{
	this.setup			= new Register(0x00, 
		{
			prim_rx:		new Bitfield(0, 0),
			pwr_up:			new Bitfield(1, 1),
			crco: 			new Bitfield(2, 2),
			en_crc:			new Bitfield(3, 3, 1),
			mask_max_rt:	new Bitfield(4, 4),
			mask_tx_ds:		new Bitfield(5, 5),
			mask_rx_dr:		new Bitfield(6, 6),
			reserved:		new Bitfield(7, 7)
		});
	this.en_aa			= new Register(0x01, 
		{
			enaa_p0:		new Bitfield(0, 0, 1),
			enaa_p1:		new Bitfield(1, 1, 1),
			enaa_p2: 		new Bitfield(2, 2, 1),
			enaa_p3:		new Bitfield(3, 3, 1),
			enaa_p4:		new Bitfield(4, 4, 1),
			enaa_p5:		new Bitfield(5, 5, 1),
			reserved:		new Bitfield(6, 7)
		});
	this.en_rxaddr		= new Register(0x02, 
		{
			dpl_p0:			new Bitfield(0, 0, 1),
			dpl_p1:			new Bitfield(1, 1, 1),
			dpl_p2: 		new Bitfield(2, 2),
			dpl_p3:			new Bitfield(3, 3),
			dpl_p4:			new Bitfield(4, 4),
			dpl_p5:			new Bitfield(5, 5),
			reserved:		new Bitfield(6, 7)
		});
	this.setp_aw		= new Register(0x03, 
		{
			aw:				new Bitfield(0, 1, 3),
			reserved:		new Bitfield(2, 7)
		});
	this.setup_retr	= new Register(0x04, 
		{
			arc:			new Bitfield(0, 3, 3),
			ard:			new Bitfield(4, 7)
		});
	this.rf_ch			= new Register(0x05, 
		{
			rf_ch:			new Bitfield(0, 6),
			reserved:		new Bitfield(7, 7)
		});
	this.rf_setup		= new Register(0x06, 
		{
			obsolete:		new Bitfield(0, 0),
			rf_pwr:			new Bitfield(1, 2, 3),
			rf_dr_high: 	new Bitfield(3, 3),
			pll_lock:		new Bitfield(4, 4),
			rf_dr_low:		new Bitfield(5, 5),
			reserved:		new Bitfield(6, 6),
			cont_wave:		new Bitfield(7, 7)
		});
	this.status		= new Register(0x07, 
		{
			tx_full:		new Bitfield(0, 0),
			rx_p_no:		new Bitfield(1, 3, 7),
			max_rt: 		new Bitfield(4, 4),
			tx_ds:			new Bitfield(5, 5),
			rx_dr:			new Bitfield(6, 6),
			reserved:		new Bitfield(7, 7)
		});
	this.observe_tx	= new Register(0x08, 
		{
			arc_cnt:		new Bitfield(0, 3),
			plos_cnt:		new Bitfield(4, 7)
		});
	this.rpd			= new Register(0x09, 
		{
			rpd:			new Bitfield(0, 0),
			reserved:		new Bitfield(1, 7)
		});
	this.rx_addr_p0	= new Register(0x0A, 
		{
			rx_addr_p0:		new Bitfield(0, 39, new Buffer([0xE7, 0xE7, 0xE7, 0xE7, 0xE7]))
		}, 5);
	this.rx_addr_p1	= new Register(0x0B, 
		{
			rx_addr_p1:		new Bitfield(0, 39, new Buffer([0xC2, 0xC2, 0xC2, 0xC2, 0xC2]))
		}, 5);
	this.rx_addr_p2	= new Register(0x0C, 
		{
			rx_addr_p2:		new Bitfield(0, 7, 0xC3)
		});
	this.rx_addr_p3	= new Register(0x0D, 
		{
			rx_addr_p3:		new Bitfield(0, 7, 0xC4)
		});
	this.rx_addr_p4	= new Register(0x0E, 
		{
			rx_addr_p4:		new Bitfield(0, 7, 0xC5)
		});
	this.rx_addr_p5	= new Register(0x0F, 
		{
			rx_addr_p5:		new Bitfield(0, 7, 0xC6)
		});
	this.tx_addr		= new Register(0x10, 
		{
			tx_addr:		new Bitfield(0, 39, new Buffer([0xE7, 0xE7, 0xE7, 0xE7, 0xE7]))
		}, 5);
	this.rx_pw_p0		= new Register(0x11, 
		{
			rx_pw_p0:		new Bitfield(0, 5),
			reserved:		new Bitfield(6, 7)
		});
	this.rx_pw_p1		= new Register(0x12, 
		{
			rx_pw_p1:		new Bitfield(0, 5),
			reserved:		new Bitfield(6, 7)
		});
	this.rx_pw_p2		= new Register(0x13, 
		{
			rx_pw_p2:		new Bitfield(0, 5),
			reserved:		new Bitfield(6, 7)
		});
	this.rx_pw_p3		= new Register(0x14, 
		{
			rx_pw_p3:		new Bitfield(0, 5),
			reserved:		new Bitfield(6, 7)
		});
	this.rx_pw_p4		= new Register(0x15, 
		{
			rx_pw_p4:		new Bitfield(0, 5),
			reserved:		new Bitfield(6, 7)
		});
	this.rx_pw_p5		= new Register(0x16, 
		{
			rx_pw_p5:		new Bitfield(0, 5),
			reserved:		new Bitfield(6, 7)
		});
	this.fifo_status	= new Register(0x17, 
		{
			rx_empty:		new Bitfield(0, 0),
			rx_full:		new Bitfield(1, 1),
			reserved: 		new Bitfield(2, 3),
			tx_empty:		new Bitfield(4, 4),
			tx_full:		new Bitfield(5, 5),
			tx_reuse:		new Bitfield(6, 6),
			reserved2:		new Bitfield(7, 7)
		});
	this.dynpd			= new Register(0x1C, 
		{
			dpl_p0:			new Bitfield(0, 0),
			dpl_p1:			new Bitfield(1, 1),
			dpl_p2: 		new Bitfield(2, 2),
			dpl_p3:			new Bitfield(3, 3),
			dpl_p4:			new Bitfield(4, 4),
			dpl_p5:			new Bitfield(5, 5),
			reserved:		new Bitfield(6, 7)
		});
	this.feature		= new Register(0x1D, 
		{
			en_dpl:			new Bitfield(0, 0),
			en_ack_pay:		new Bitfield(1, 1),
			en_dyn_ack:		new Bitfield(2, 2),
			reserved:		new Bitfield(3, 7)
		});
}

module.exports = Registerset;