var args = arguments[0] || {};
var u = require("utility");
var F = require("form");
u.initStyleProperty($.container, args);


exports.init = function(options) {
	if (!options.items) {
		Ti.API.warn("spinner: empty items");
	}
	
	$._items = options.items;
	$._pickerStyle = options.pickerStyle;
	
	// initialize value
	exports.setValue(options.value || $._items[0][1]);
}

exports.release = function() {
	
}

exports.getValue = function() {
	return $._value;
}

exports.setValue = function(val) {
	$._value = val;
	// update display
	updateDisplayAndValue();
}

function updateDisplayAndValue(item) {
	// item이 없는 경우 현재 value에 맞춰서 업데이트한다.
	if (!item) {
		item = _.find($._items, function(i) { return i[1] == $._value });
	}
	if (item) {
		$._value = item[1];
		$.valueLabel.text = item[0];
	}
}

function openPickerWindow() {
	var win = F.createSimplePickerWindow({
		items: $._items,
		value: $._value,
		pickerStyle: $._pickerStyle,
		onUpdate: function(e) { updateDisplayAndValue(e) },
	});
	win.open();
}

