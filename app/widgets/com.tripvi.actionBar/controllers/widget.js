// 기준 해상도에 맞춰서 사이즈 조정
var MAKE_LAYOUT_FIT = Alloy.Globals.makeLayoutFit ? Alloy.Globals.makeLayoutFit : function(c) {};

MAKE_LAYOUT_FIT($);



/** MENU 형식
 */
// icon: '/appicon.png',
// icon_width: 32,
// icon_height: 32,
// title: 'About',
// callback: function() { doClickMenu() },
// showAsAction: Ti.Android.SHOW_AS_ACTION_COLLAPSE_ACTION_VIEW,



/**
 *	initialize ActionBar
 *	  - actionBar를 만들려면 navBarHidden이 false이고, _actionBarHidden이 false이어야함
 *	  
 */
exports.init = function(window, options) {
	
	options = options || {}
	if (window._options) _.extend(options, window._options);
	
	$._window = window;
	
	$._isRoot = options.rootWindow;
	$._useDrawerMenu = options.useDrawerMenu;
	
	$._title = options.title;
	if (!$._title) {
		$._title = window.titleid ? L(window.titleid) : window.title;
	}
	
	$._menuOptions = options.menu;
	$._menus = []; // 만들어진 menu items
	
	$._tabOptions = options.tabs;
	$._tabs = []; // 만들어진 tab items

	createActionBarView();
}

function createActionBarView() {
	if ($._window.navBarHidden || $._window._actionBarHidden || $._window.actionBarHidden) {
		// navBarHidden인 경우에는 표시안함
	} else {
		if ($._useDrawerMenu) {
			// drawer menu는 이미 공간이 확보되어있음
		} else {
			// 넣을 공간만큼 수동으로 layout을 조정해줘야함
			var container = $._window.children[0];
			if (container) {
				container.top = "48"; // 고정값 dp임. 화면폭에 따라 키우지 않는다.
			}
		}
		// actionBar를 추가하고
		$._window.add($.widget);
		$._window.navBarHidden = true; // native navBar는 숨김
		
		// tabBar 또는 title
		if ($._tabOptions) {
			makeTabBar();
		} else {
			exports.setTitle($._title);
		}
		
		// init
		exports.makeAsRoot($._isRoot);
		exports.makeActionItems($._menuOptions);
	}
}

function releaseActionBarView() {
	$._window.remove($.widget);
	removeTabBar();
	removeTitle();
	exports.releaseActionItems();
}



/** Tab Bar
 */
function makeTabBar() {

	var bar = Ti.UI.createView({
		width: 204,
		height: "47", // 1은 bottom border
		layout: 'horizontal',
	});
	MAKE_LAYOUT_FIT([bar]);
	
	var num = _.size($._tabOptions.names);
	$._tabs = [];
	
	_.each($._tabOptions.names, function(name, k) {
		
		var tb = Ti.UI.createView({
			width: 204 / num,
			height: "47",
			_index: k,
		});
		
		var label = Ti.UI.createLabel({
			top: 2,
			width: Ti.UI.FILL,
			height: "40",
			font: { fontSize: 14, fontWeight: 'bold' },
			text: name,
			textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
			color: '#2f2f2f',
		});
		tb.add(label);
		
		var marker = Ti.UI.createView({
			bottom: 0,
			width: Ti.UI.FILL,
			height: "5",
			backgroundColor: "#67B6DF",
			visible: false,
		});
		tb.add(marker);

		tb._makeCurrent = function(b) {
			if (b) { // hightlight
				Ti.API.info('tabBar make active - ' + k + ': ' + name);

				if ($._currentTab == tb) {
					return false;
				}

				// 기존 tab 비활성화
				if ($._currentTab) $._currentTab._makeCurrent(false);

				label.color = "#67B6DF";
				marker.visible = true;

				$._currentTab = tb;
			}
			else { // restore
				label.color = '#2f2f2f';
				marker.visible = false;
			}
			
			return true;
		}
		
		function onTabClick() {
			if (this._makeCurrent(true)) {
				$._window.fireEvent('tabclick', { index: this._index });
			}
		}
		
		tb.addEventListener('click', onTabClick);
		
		tb._release = function() {
			tb.removeEventListener('click', onTabClick);
			tb._makeCurrent = undefined;
			tb._release = undefined;
		}

		MAKE_LAYOUT_FIT([tb, label, marker]);
		bar.add(tb);
		$._tabs.push(tb);
	});

	$._tabBar = bar;
	$.widget.add(bar);
	
	
	// 처음 시작하는 tab index
	exports.setCurrentTab($._tabOptions.index || 0);
}

exports.setCurrentTab = function(idx, silent) {
	var tb = $._tabs[idx];
	if (tb) {
		if (tb._makeCurrent(true) && !silent) {
			$._window.fireEvent('tabclick', { index: idx });
		}
	}
}

function removeTabBar() {
	_.each($._tabs, function(tb) {
		if (tb._release) tb._release();
		$._tabBar.remove(tb);
	});
	$._tabs = [];

	if ($._tabBar) {
		$.widget.remove($._tabBar);
		$._tabBar = undefined;
	}
}



/** Title
 */

exports.setTitle = function(title) {
	if (!title) return;
	
	if (_.isString(title)) {
		makeTitleLabel(title);
	} else if (title) {
		// view인 경우
		removeTitle();
		// TODO: $.widget.add(...);
		$.title.add(title);
	}
}

exports.getTitle = function() {
	if ($._hasTitleLabel && $._titleLabel) {
		return $._titleLabel.text;
	} else {
		// TODO: $._title
		return $.title.children[0];
	}
}

function makeTitleLabel(title) {
	if (!$._hasTitleLabel) {
		$._titleLabel = Ti.UI.createLabel({
			text: title,
			font: { fontSize: "21" },
			color: '#fff',
			width: Ti.UI.SIZE,
			ellipsize: true,
			wordWrap: false,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		});
		$.title.add($._titleLabel);
	}
	
	$._titleLabel.text = title;
	$._hasTitleLabel = true;
}

function removeTitle() {
	// TODO: $.widget.remove(...);
	$.title.removeAllChildren();
	$._hasTitleLabel = false;
	$._titleLabel = undefined;
}



/** Root Icon
 */

exports.makeAsRoot = function(isRoot) {
	if (!!isRoot) {
		$.backIcon.visible = false;
		if ($._useDrawerMenu) {
			$.drawerIcon.visible = true;
		}
	} else {
		$.backIcon.visible = true;
		$.drawerIcon.visible = false;
	}
	$._isRoot = isRoot;
}

exports.onDrawerSlide = function(offset) {
	var v = (offset * offset) * -5;
	$.drawerIcon.left = v;
}



/** MENU
 */

exports.makeActionItems = function(items) {
	if (!items || items.length == 0) return;
	
	// 이전 actionItems 제거
	exports.releaseActionItems();
	
	
	// collapseAction을 골라낸다.
	// actionButtons에서 제일 마지막에 추가되어야한다.
	var more = [];
	
	_.each(items, function(item) {
		if (item.showAsAction == Ti.Android.SHOW_AS_ACTION_COLLAPSE_ACTION_VIEW) {
			more.push(item);
		} else {
			var width = item.icon_width || 32;
			var height = item.icon_height || 32;
			
			var button = Ti.UI.createButton({
				top: (48 - height)/2,
				left: 4,
				width: width,
				height: height,
				backgroundImage: item.icon,
			});
			
			if (item.callback) {
				button.addEventListener('click', item.callback);
			}
			button._release = function() {
				if (item.callback) {
					button.removeEventListener('click', item.callback);
				}
				$.actionButtons.remove(button);
				button._release = undefined;
			}
			
			$._menus.push(button);
			$.actionButtons.add(button);
		}
	});
	
	// collapseAction을 popup으로 보여줌
	if (more.length > 0) {
		var button = Ti.UI.createView({
			width: 49,
			height: 48,
			_more: "more",
		});
		
		var buttonIcon = Ti.UI.createImageView({
			width: 6,
			height: 22,
			image: WPATH('overflow.png'),
		});
		button.add(buttonIcon);
		
		function onClickMore(e) {
			e.source.touchEnabled = false; // 여러번 클릭을 막기위한 코드
			setTimeout(_.bind(function() { this.touchEnabled = true }, e.source), 1000);
			
			// actionBar에서 MENU가 열리는것처럼 열려야함
			// transparent window를 만들고, Popup Table을 띄움
			var win = Ti.UI.createWindow({
				backgroundColor: "transparent", 
				opacity: 1, // opacity를 줘야 transparent window를 만들수있음
			});
			
			var view = Ti.UI.createView({
				top: "48",
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
				win.removeEventListener('click', onAndroidback);
				table.removeEventListener('click', onClickMoreItem);
			}
			function onAndroidback(ev) {
				closeWindow();
			}
			function onClickWindow(ev) {
				if (!ev.source.toString().match(/table/gi)) {
					closeWindow();
				}
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
				closeWindow();
			}
			
			table.addEventListener('click', onClickMoreItem);
			
			// open
			win.open();
		}
		
		button.addEventListener('click', onClickMore);
		
		button._release = function() {
			button.removeEventListener('click', onClickMore);
			$.actionButtons.remove(button);
			button._release = undefined;
		}
		
		$.actionButtons.add(button);
		$._menus.push(button);
	} else {
		// right padding이 필요함
		if ($._menus.length > 0) {
			$._menus[$._menus.length - 1].right = 8;
		}
	}
}

exports.releaseActionItems = function() {
	_.each($._menus, function(menu) {
		if (menu._release) menu._release();
	});
	
	$.actionButtons.removeAllChildren();
	
	$._menus = [];
}

exports.showActionItems = function() {
	$.actionButtons.visible = true;
}

exports.hideActionItems = function() {
	$.actionButtons.visible = false;
}



/**
 *	UI EVENTS
 *
 */

function doClickHome(e) {
	$._window.fireEvent('actionbarhome', { root: $._isRoot });
}




/**
 *	release
 *
 */

exports.release = function() {

	//
	$.home.removeEventListener('click', doClickHome);
	$.destroy();

	//
	releaseActionBarView();
	$._window = undefined;
	$._menuOptions = undefined;
	$._menu = undefined;
	$._tabOptions = undefined;
	$._tabs	= undefined;
	
	$._titleLabel = undefined;
	
	
	//
	if (Alloy.Globals.releaseController) Alloy.Globals.releaseController($);
	$ = undefined;
}
