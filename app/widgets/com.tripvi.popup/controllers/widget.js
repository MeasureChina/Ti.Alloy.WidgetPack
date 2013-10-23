// 기준 해상도에 맞춰서 사이즈 조정
var MAKE_LAYOUT_FIT = Alloy.Globals.makeLayoutFit ? Alloy.Globals.makeLayoutFit : function(c) {};

MAKE_LAYOUT_FIT($);



/**
 *	init & release
 *	  
 */
exports.init = function(window, options) {
	$._window = window;
}

exports.release = function() {
	$.destroy();
	$._window = undefined;
	
	//
	releasePopup();
	
	//
	if (Alloy.Globals.releaseController) Alloy.Globals.releaseController($);
	$ = undefined;
}


/**
 *	popup
 *	  
 */
exports.openPopup = function(options) {
	createPopup();
	
	$.p_icon.image = options.icon || "/appicon.png";
	$.p_title.text = options.text || "popup message";
	
	$._popup.show();
}

exports.closePopup = function(options) {
	$._popup.hide();
}

function createPopup() {
	if (!$._popup) {
		$._window.add($.popup);
		$._popup = $.popup;
	}
}

function releasePopup() {
	if ($._popup) {
		$._window.remove($._popup);
	}
}









function onClickDialogShim(e) {
	
}

function onClickIndicatorShim(e) {
	
}


