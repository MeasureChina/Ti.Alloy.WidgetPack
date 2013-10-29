var args = arguments[0] || {};
var u = require("utility");
var F = require("form");
u.initStyleProperty($.container, args);


exports.init = function(options) {
	options = options || {};
	// initialize value
	exports.setValue(options.value);
	
	// TODO: hint text
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

function updateDisplayAndValue(text) {
	if (!text) {
		text = $._value;
	} else {
		$._value = text;
	}
	$.valueLabel.text = $._value;
}

function openPickerWindow() {
	var win = Ti.UI.createWindow({// open as heavy-weight window
		windowSoftInputMode: Ti.UI.Android.SOFT_INPUT_ADJUST_RESIZE | Ti.UI.Android.SOFT_INPUT_STATE_ALWAYS_VISIBLE,
		backgroundColor: "white",
	});
	
	var container = Ti.UI.createView();
	win.add(container);
	
	var textArea = Ti.UI.createTextArea({
		top: 10,
		bottom: 10,
		left: 12,
		right: 12,
		value: $._value,
	});
	container.add(textArea);
	
	// TODO: close button
	
	win.addEventListener("close", function(e) {
		updateDisplayAndValue(textArea.value);
	});
	
	Alloy.Globals.openWindow(win);
}
