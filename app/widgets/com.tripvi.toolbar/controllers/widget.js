// 기준 해상도에 맞춰서 사이즈 조정
var MAKE_LAYOUT_FIT = Alloy.Globals.makeLayoutFit ? Alloy.Globals.makeLayoutFit : function(c) {};

MAKE_LAYOUT_FIT($);



/**
 *	  
 */
exports.init = function(options) {
	options = options || {}
	
	$._buttons = [];
	
	if (options.leftActions) {
		_.each(options.leftActions, function(a) {
			var button = createIconTextButton(a);
			$.leftView.add(button);
			$._buttons.push(button);
		});
	}
	if (options.centerActions) {
		_.each(options.centerActions, function(a) {
			var button = createIconTextButton(a);
			$.centerView.add(button);
			$._buttons.push(button);
		});
	}
	if (options.rightActions) {
		_.each(options.rightActions, function(a) {
			var button = createIconTextButton(a);
			$.rightView.add(button);
			$._buttons.push(button);
		});
	}
	
	$.indicatorLabel.text = options.indicatorText || "loading...";
	
	if (!options.visible) {
		$.toolbar.visible = false;
	}
}

function createIconTextButton(a) {
	var button = Ti.UI.createView({
		width: Ti.UI.SIZE,
		layout: 'horizontal',
	});
	if (a.icon) {
		var ic = Ti.UI.createImageView({
			width: 32,
			height: 32,
			image: a.icon,
			right: 3,
		});
		button.add(ic);
	}
	if (a.title) {
		var lb = Ti.UI.createLabel({
			font: { fontSize: 16 },
			color: "#222",
			width: Ti.UI.SIZE,
			height: Ti.UI.FILL,
			text: a.title,
		});
		button.add(lb);
	}
	
	function callbackWrapper() {
		_.isFunction(a.callback) && a.callback();
	}
	
	button.addEventListener("click", callbackWrapper);
	
	button._release = function() {
		button.removeEventListener("click", callbackWrapper);
		button._release = undefined;
	};
	
	return button;
}


exports.release = function() {
	$.destroy();
	
	_.each($._buttons, function(b) {
		if (b && b._release) b._release();
	});

	if (Alloy.Globals.releaseController) Alloy.Globals.releaseController($);
	$ = undefined;
}


exports.show = function() {
	$.toolbar.show();
}

exports.hide = function() {
	$.toolbar.hide();
	exports.closeIndicator();
}

exports.openIndicator = function() {
	$.centerView.hide();
	$.indicator.show();
}

exports.closeIndicator = function() {
	$.indicator.hide();
	$.centerView.show();
}
