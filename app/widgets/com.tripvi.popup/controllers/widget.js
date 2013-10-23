// 기준 해상도에 맞춰서 사이즈 조정
var MAKE_LAYOUT_FIT = Alloy.Globals.makeLayoutFit ? Alloy.Globals.makeLayoutFit : function(c) {};

MAKE_LAYOUT_FIT($);



/**
 *	window
 *	  
 */
function onCloseWindow(e) {
	$.win.removeEventListener('androidback', onAndroidBack);
	$.win.removeEventListener('close', onCloseWindow);
	exports.release();
}
function onAndroidBack(e) {
	$.win.close();
}

$.win.addEventListener('close', onCloseWindow);




/**
 *	popup
 *	  
 */
exports.openPopup = function(options) {
	$.p_icon.image = options.icon || "/appicon.png";
	$.p_title.text = options.text || "popup";
	
	// 다른 팝업 감추기
	$.indicator.visible = false;
	
	// 변수 초기화
	$.popup.visible = true;
	$.popup.transform = Ti.UI.create2DMatrix().scale(1.1, 1.1);
	$.popup.opacity = 0.95;
	
	$.win.addEventListener('androidback', onAndroidBack); // popup은 back 사용가능

	$.win.addEventListener("open", openPopupEffect);
	$.win.open();
}

exports.closePopup = function(options) {
	if ($ && $.win) $.win.close();
}

function openPopupEffect() {
	
	$.popup.animate({
		anchorPoint: { x: 0.5, y: 0.5 },
		transform: Ti.UI.create2DMatrix(),
		opacity: 1,
		duration: 400,
	}, function() {
		
		// 1초후에 자동 닫힘
		setTimeout(closePopupEffect, 1000);
	
	});
	
	$.win.removeEventListener("open", openPopupEffect);
}

function closePopupEffect() {
	if ($ && $.win && $.popup) {
		
		$.popup.animate({
			opacity: 0,
			duration: 500,
		}, function() {
			exports.closePopup();
		});
	}
}




/**
 *	indicator
 *	  
 */
exports.openIndicator = function(options) {
	$.i_title.text = options.text || "loading...";
	
	// 다른 팝업 감추기
	$.popup.visible = false;
	
	// 변수 초기화
	$.indicator.visible = true;
	$.indicator.transform = Ti.UI.create2DMatrix().scale(1.1, 1.1);
	
	$.win.addEventListener("open", openIndicatorEffect);
	$.win.open();
}

exports.closeIndicator = function(options) {
	closeIndicatorEffect();
}

function openIndicatorEffect() {
	
	$.i_icon.start();
	
	$.indicator.animate({
		anchorPoint: { x: 0.5, y: 0.5 },
		transform: Ti.UI.create2DMatrix(),
		duration: 400,
	});
	
	$.win.removeEventListener("open", openIndicatorEffect);
}

function closeIndicatorEffect() {
	if ($ && $.win && $.indicator) {
		
		$.indicator.animate({
			opacity: 0,
			duration: 500,
		}, function() {
			$.i_icon.stop();
			$.win.close();
		});
	}
}




/**
 *	release
 *	  
 */
exports.release = function() {
	$.destroy();
	
	$.popup.removeEventListener("click", exports.closePopup);
	
	//
	if (Alloy.Globals.releaseController) Alloy.Globals.releaseController($);
	$ = undefined;
}
