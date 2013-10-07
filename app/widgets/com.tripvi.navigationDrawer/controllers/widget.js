// 기준 해상도에 맞춰서 사이즈 조정
var MAKE_LAYOUT_FIT = Alloy.Globals.makeLayoutFit ? Alloy.Globals.makeLayoutFit : function(c) {};

MAKE_LAYOUT_FIT($);



/**
 *	initialize navigationDrawer
 *	  
 */
exports.init = function(window, options) {
	
	if (!options || !options.navigation) {
		Ti.API.info("com.tripvi.navigationDrawer:  options.navigation should not empty.");
		return;
	}
	
	$._window = window;
	
	
	/** navigation을 만들고
	 */
	$._nav = Ti.UI.createTableView({
		width: "240dp",
		separatorColor: "#333539",
		backgroundColor: '#212226',
		scrollsToTop: false,
		overScrollMode: Ti.UI.Android.OVER_SCROLL_NEVER,
	});
	
	
	$._menus = options.navigation; // cache하고 다시 생성할때 사용함
	$._currentMenu = undefined;
	$._menuIndex = {};
	$._leftMenuSections = [];
	
	
	_.each(options.navigation, function(menu) {
		var section = Ti.UI.createTableViewSection();
		
		if (menu.items) {
			// 각 section별 메뉴를 만든다.
			_.each(menu.items, function(item) {
				var row = Ti.UI.createTableViewRow({
					width: Ti.UI.FILL,
					height: 46,
					_name: item.name,
				});
				
				MAKE_LAYOUT_FIT([row]);
				
				if (item.name == 'section_title') {
					row.height = 36;
					
					var wrapper = Ti.UI.createView({
						width: Ti.UI.FILL,
						height: 36,
						backgroundColor: "#333539",
					})
					row.add(wrapper);
					
					var title = Ti.UI.createLabel({
						left: 9,
						width: 170,
						font: { fontSize: 17 },
						color: '#fff',
						text: item.title,
					});
					wrapper.add(title);
					
					MAKE_LAYOUT_FIT([wrapper, title]);
				}
				else {
					Ti.API.info('  - add menu: ' + item.name);
					
					var wrapper = Ti.UI.createView({
						width: Ti.UI.FILL,
						height: 46,
						backgroundColor: "#212226"
					})
					row.add(wrapper);

					var icon = Ti.UI.createImageView({
						left: 9,
						image: item.icon,
						width: 27,
						height: 27,
					});
					wrapper.add(icon);
					
					var title = Ti.UI.createLabel({
						left: 50,
						width: 170,
						font: { fontSize: 16 },
						color: '#949494',
						text: item.title,
					});
					wrapper.add(title);
					
					MAKE_LAYOUT_FIT([wrapper, icon, title]);
				}
				
				if (item.name == 'favorite_index') {
					row._updateRow = function(options) {
						title.text = item.title + "(" + options.favorites_count + ")"
					}
				}
				
				row._setCurrentMenu = function(active) {
					title.color = active ? (item.selectedColor || "#949494") : "#949494"; 
				}
				
				row._release = function() {
					row.removeEventListener('click', onClickRow);
					row.makeActive = undefined;
					row._updateRow = undefined;
					row._setCurrentMenu = undefined;
					row._release = undefined;
				}
				
				row.makeActive = function() {
					// don't reload current window
					
					if (row._name == "section_title") {
						return;
					}
					
					if (row == $._currentMenu) {
						// 메뉴 닫음
						exports.closeMenu();
						return;
					}
					
					// create controller and view
					if (item.window) {
						// View 형태로 오픈한다.
						// - 보통 Window Event 처리가 달라져야함.
						var c = Alloy.createController(item.window, { openAsView: true });
						var v = c.getView();
						
						// window title 저장
						if (v.titleid) {
							row._title = L(v.titleid); // titleid 사용
						} else {
							row._title = v.title; 
						}
						
						if (OS_ANDROID) {
							// android는 window를 중첩시킬수없으므로, 첫번째 child view를 wrapper로 간주하고 사용한다.
							// 따라서 menu로 사용되는 controller에서는 필요한 컨텐츠가 전부 첫번째 child view에 담겨있어야 한다.
							var window_options = v._options;
							v = v.children[0];
							v._options = window_options;
						}
						
						v.top = 0;
						v.left = 0;
						v.width = Ti.UI.FILL;
						v.height = Ti.UI.FILL;
						
						// 컨텐츠 View 바꿔치기
						setContentView(v);
						row._view = v;
						
						// menu가 변경될때 resource 해제해야함
						row._releaseResources = function() {
							row._releaseResources = undefined;
							row._view._options = undefined;
							row._view = undefined;
						}
						
						// To prevent flickering, remove view after the new one is inserted
						if ($._currentMenu) {
							$._currentMenu._view.fireEvent('blur'); // TODO: window인 경우. 제거헤야함
							$._currentMenu._view.fireEvent('close'); // TODO: window인 경우. 제거헤야함
							
							// make row normal, not active state
							$._currentMenu._setCurrentMenu(false);

							if ($._currentMenu._releaseResources) {
								$._currentMenu._releaseResources(); // 리소스 해제
							}
							
							$._currentMenu = undefined;
						}
						
						// make the new row active state
						$._currentMenu = row;
						$._currentMenu._setCurrentMenu(true);
						$._currentMenu._view.fireEvent('open'); // TODO: window인 경우. 제거헤야함
						$._currentMenu._view.fireEvent('focus'); // TODO: window인 경우. 제거헤야함
						
						$.trigger('menuselect', { title: $._currentMenu._title, options: $._currentMenu._view._options });
					}
					else if (item.onClick) {
						item.onClick();
					}
					
					// 메뉴 닫음
					if (!item.skipCloseMenu) {
						exports.closeMenu();
					}
					
					Ti.API.info('[WINDOW] openAsView');
					Ti.API.info('   menu:select > ' + item.name);
				}
				
				//
				row._setCurrentMenu(false);
				
				function onClickRow(e) {
					// TODO: badge나 다른 버튼 눌러지는거 체크
					row.makeActive();
				}
				
				row.addEventListener('click', onClickRow);
				
				section.add(row);
				$._menuIndex[item.name] = row;
			});
		}
		
		$._leftMenuSections.push(section);
		$._menuIndex[menu.section] = section;
	});
	

	$._nav.setData($._leftMenuSections);

	Ti.API.info('  ...building menu done - ' + _.size($._menuIndex));


	// drawer
	$.drawer.leftView = $._nav;
	$._window.add($.drawer);
	
	
	return exports;
}

// container content view를 추가
function setContentView(v) {
	$.drawer.centerView = v;
}



/**
 *	Drawer Action
 *
 */
exports.toggleLeftDrawer = function() {
	$.drawer.toggleLeftWindow();
}
exports.openLeftDrawer = function() {
	$.drawer.openLeftWindow();
}
exports.closeLeftDrawer = function() {
	$.drawer.closeLeftWindow();
}



/**
 *	Menu accessor & updater
 *
 */
exports.updateMenu = function(menuName, data) {
	var menu = exports.findMenuByName(menuName);
	if (menu && menu._updateRow) {
		menu._updateRow(data);
	}
}
exports.openMenuByName = function(name) {
	if (name == exports.currentMenuName()) return;

	var menu = exports.findMenuByName(name);
	if (menu) {
		menu.makeActive();
	} else {
		Ti.API.error('navigationDrawer: invalid menu name -> ' + name);
	}
}
exports.findMenuByName = function(name) {
	return $._menuIndex[name];
}
exports.currentMenuName = function() {
	return $._currentMenu ? $._currentMenu._name : undefined;
}
exports.closeMenu = function() {
	$.drawer.closeLeftWindow();
}




/**
 *	Event Handlers
 *
 */
function onOpenDrawer(e) {	
	e.cancelBubble = true;
	$.trigger("open", e);
}
function onCloseDrawer(e) {
	e.cancelBubble = true;
	$.trigger("close", e);
}
function onDrawerslide(e) {
	e.cancelBubble = true;
	$.trigger("drawerslide", e);
}



/**
 *	Release
 *
 */
exports.release = function() {
	
	// release는 한번만 실행되고, 모든 리소스가 제거되기 때문에 Controller는 재사용이 불가능함
	// 재사용을 위해서는 uninit()를 사용한다.
	if (!$) return;
	Ti.API.info("com.tripvi.navigationDrawer released <<<");
	

	// remove all event listeners
	$.drawer.off();
	
	
	var rows = _.values($._menuIndex);
	// 모든 resources 삭제
	_.each(rows, function(row) {
		if (row._releaseResources) row._releaseResources();
		if (row._release) row._release();
	});
	
	$._currentMenu = undefined;
	$._menuIndex = {};
	$._leftMenuSections = [];
	$._menus = [];
	
	$._nav.setData([]);
	
	//
	// Alloy.Collections.myLists.off(); // TODO: 수정해야함
	// clearListRows();
	
}
