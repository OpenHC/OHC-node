//possible field types are int, float, onoff, bool, string, slider
//the types int, float and string are displayed as an edittext field
//onoff is represented by a switch and hadled as a boolean
//for fields with type bool a checkbox is displayed on the ui, internally handled as a non-inverted boolen
//a slider is displayed as a slider on the ui
//sliders are technically either ints or floats depending on the max_value attribute
// (max - min > 1) => int, (max - min <= 1) => float
//max_value and min_value in conjunction with strings referr to maximum and minimum length of the string 

var conf = new Object();
var device = new Object();
device.num_fields = 2;
device.fields = new Object();
var field0 = new Object();
field0.length = 1;
field0.readable = true;
field0.writable = true;
field0.name = 'state';
field0.max_value = 1;
field0.min_value = 0;
field0.value = false;
field0.type = 'onoff';
var field1 = new Object();
field1.length = 10;
field1.readable = true;
field1.writable = true;
field1.name = 'test'
field1.max_value = 9;
field1.min_value = 0;
field1.value = 'tSYS';
field1.type = 'string';
device.fields[0] = field0;
device.fields[1] = field1;
device.addr = new Buffer([0x42, 0x42, 0x42, 0x42, 0x42]);
device.name_default = 'RC power outlet';
device.name_custom = '';
conf['4242424242'] = device;
