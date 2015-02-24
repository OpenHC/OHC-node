function Device(ohc, internal_key)
{
	this.ohc = ohc;
	this.key = internal_key;
	this.config = ohc.conf_devices.config[internal_key];
	this.last_value = undefined;
}

Device.field_types = Object();
Device.field_types['int'] = 'number';
Device.field_types['float'] = 'number';
Device.field_types['onoff'] = 'boolean';
Device.field_types['bool'] = 'boolean';
Device.field_types['string'] = 'string';
Device.field_types['slider'] = 'number';

Device.prototype.get_name = function()
{
	if(typeof this.config.name_custom !== 'string' || this.config.name_custom.length == 0)
	{
		return this.config.name_default;
	}
	else
	{
		return this.config.name_custom;
	}
}

Device.prototype.set_name = function(name)
{
	this.config.name_custom = name;
	this.save_config();
}

Device.prototype.get_num_fields = function()
{
	return this.config.num_fields;
}

Device.prototype.set_field_value = function(num, value)
{
	var field = this.config.fields[num];
	if(typeof value != Device.field_types[field.type])
		return false;
	if(typeof value != 'boolean')
	{
		if(typeof value == 'number' && (value > field.max_value || value < field.min_value))
		{
			return false;
		}
		if(typeof value == 'string' && (value.length > field.max_value || value.length < field.min_value))
		{
			return false;
		}
	}
	field.value = value;
	this.commit_current_value(num);
	return true;
}

Device.prototype.commit_current_value = function(num)
{
	this.ohc.remote_write_field(this.key, this.get_field(num), this);
}

Device.prototype.save_config = function()
{
	this.ohc.conf_devices.save();
}

Device.prototype.get_field_value = function(num)
{
	return this.config.fields[num].value;
}

Device.prototype.get_field = function(num)
{
	return this.config.fields[num];
}

Device.prototype.get_safe_repr = function()
{
	var obj = new Object();
	obj.name = this.get_name();
	obj.num_fields = this.get_num_fields();
	obj.fields = new Array();
	for(var i = 0; i < this.config.num_fields; i++)
	{
		var field = this.get_field(i);
		if(field.readable)
			obj.fields.push(field);
	}
	return obj;
}

module.exports = Device;
