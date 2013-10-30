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
	
	// right와 overflow는 하나만 생성된다.
	if (options.overflowActions && options.rightActions) {
		Ti.API.warn("com.tripvi.toolbar init():  both of overflowActions and rightActions were assigned, rightActions will be ignored.");
	}
	if (options.overflowActions) {
		var button = createOverflowButton(options.overflowActions);
		if (button) {
			$.rightView.add(button);
			$._buttons.push(button);
		}
	}
	else if (options.rightActions) {
		_.each(options.rightActions, function(a) {
			var button = createIconTextButton(a);
			$.rightView.add(button);
			$._buttons.push(button);
		});
	}
	
	$.indicatorLabel.text = options.indicatorText || "Loading...";
	
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

function createOverflowButton(more) {
	if (more.length > 0) {
		var button = Ti.UI.createView({
			width: "48",
			height: "48",
			_more: "more",
		});
		
		var buttonIcon = Ti.UI.createImageView({
			width: 32,
			height: 32,
			image: WPATH('ic_action_overflow.png'),
		});
		button.add(buttonIcon);
		
		function onClickMore(e) {
			e.source.touchEnabled = false; // 여러번 클릭을 막기위한 코드
			setTimeout(_.bind(function() { this.touchEnabled = true }, e.source), 1000);
			
			var win = Ti.UI.createWindow({
				backgroundColor: "transparent", 
				opacity: 1, // opacity를 줘야 transparent window를 만들수있음
			});
			
			var view = Ti.UI.createView({
				bottom: "48",
				right: "5",
				width: 135,
				height: Ti.UI.SIZE,
				backgroundColor: "#000",
			});
			win.add(view);
			
			var table = Ti.UI.createTableView({
				scrollable: false,
				width: 135,
				height: Ti.UI.SIZE,
				showVerticalScrollIndicator: false,
				overScrollMode: Ti.UI.Android.OVER_SCROLL_NEVER,
				separatorColor: '#d6d6d6',
			});
			view.add(table);
			
			var rows = [];
			
			_.each(more, function(item) {
				var row = Ti.UI.createTableViewRow({
					height: "52",
				});
				
				if (item.icon) {
					var icon = Ti.UI.createImageView({
						left: 15,
						width: "32",
						height: "32",
						image: item.icon,
					});
					row.add(icon);
					
					MAKE_LAYOUT_FIT([icon]);
				}
				
				var title = Ti.UI.createLabel({
					font: { fontSize: 16 },
					left: item.icon ? 46 : 15,
					height: Ti.UI.FILL,
					text: item.title,
				});
				row.add(title);
				
				MAKE_LAYOUT_FIT([title]);
				
				rows.push(row);
			});
			
			table.setData(rows);
			
			MAKE_LAYOUT_FIT([view, table]);
			
			function closeWindow() {
				win.close();
			}
			
			// event handlers
			function onOpenWindow(ev) {
				
			}
			function onCloseWindow(ev) {
				win.removeEventListener('open', onOpenWindow);
				win.removeEventListener('click', onClickWindow);
				win.removeEventListener('close', onCloseWindow);
				win.removeEventListener('androidback', onAndroidback);
				table.removeEventListener('click', onClickMoreItem);
			}
			function onAndroidback(ev) {
				closeWindow();
			}
			function onClickWindow(ev) {
				closeWindow();
			}
			
			win.addEventListener('open', onOpenWindow);
			win.addEventListener('close', onCloseWindow);
			win.addEventListener('androidback', onAndroidback);
			win.addEventListener('click', onClickWindow);
			
			function onClickMoreItem(ev) {
				var m = more[ev.index];
				if (m && m.callback) {
					m.callback();
				}
			}
			
			table.addEventListener('click', onClickMoreItem);
			
			// open
			win.open();
		}
		
		button.addEventListener('click', onClickMore);
		
		button._release = function() {
			button.removeEventListener('click', onClickMore);
			button._release = undefined;
		}
		
		return button;
	}
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
