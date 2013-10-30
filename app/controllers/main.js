var drawer = Alloy.createWidget("com.tripvi.navigationDrawer");
drawer.init($.win, {
	navigation: [
		{
			section: 'default',
			title: null, // no header view
			items: [
				{
					name: 'setting_about',
					title: "One",
					icon: '/appicon.png',
					window: 'page1',
					selectedColor: "#844c96",
				},
				{
					name: 'home',
					title: "Two",
					icon: '/appicon.png',
					window: 'page2',
					selectedColor: "#844c96",
				},
				{
					name: 'person_index',
					title: "Three",
					icon: '/appicon.png',
					window: 'page3',
					selectedColor: "#844c96",
				},
				{
					name: 'event_index',
					title: "Click Event",
					icon: '/appicon.png',
					onClick: function() {
						alert(1);
					},
				},
				{
					name: 'photo_picker_single',
					title: "Photo Picker (single)",
					icon: '/appicon.png',
					onClick: function() {
						
						var options = {
							mode: "single",
							remember_list_album: false,
							max_count: 10,
						}
						
						var c = Alloy.createController("photo_picker", options);
						Alloy.Globals.openWindow(c.getView());
						
						c.on("select:cover_photo", function(e) {
							console.log("fire event select cover photos");
							console.log(e.cover_photo);
						});
					},
				},
				{
					name: 'photo_picker_multi',
					title: "Photo Picker(multi)",
					icon: '/appicon.png',
					onClick: function() {
						
						var options = {
							mode: "multiple",
							remember_list_album: true,
							max_count: 10,
						}
						
						var c = Alloy.createController("photo_picker", options);
						Alloy.Globals.openWindow(c.getView());
						
						c.on("select:photos", function(e) {
							console.log("fire event select photos");
							console.log(e.photos);
						});
					},
				}
			],
		},
	]
});

drawer.on('menuselect', function(e) {
	// 변경된 menu 적용
	if (e.options && e.options.menu) {
		actionBar.makeActionItems(e.options.menu);
	} else {
		actionBar.makeActionItems();
	}
	
	// titleView는 window._options의 title 속성을 우선함
	if (e.options && e.options.title) {
		$._lastWindowTitle = e.options.title;
	} else {
		$._lastWindowTitle = e.title;
	}
});
drawer.on('draweropen', function(e) {
	// actionbar title 변경
	$._lastWindowTitle = $._lastWindowTitle || actionBar.getTitle();
	actionBar.setTitle("MENU");
	// actions 감추기
	actionBar.hideActionItems();
});
drawer.on('drawerclose', function(e) {
	// actionbar title 복구
	actionBar.setTitle($._lastWindowTitle || $.win.title);
	$._lastWindowTitle = undefined;
	// actions 복구
	actionBar.showActionItems();
});
drawer.on('drawerslide', function(e) {
	actionBar.onDrawerSlide(e.offset);
});


var actionBar = Alloy.createWidget("com.tripvi.actionBar");
actionBar.init($.win, {
	rootWindow: true,
	useDrawerMenu: true,
});
$.win._actionBar = actionBar;

$.win.addEventListener("actionbarhome", function() {
	drawer.toggleLeftDrawer();
});


function onOpenWindow(e) {
	// default menu
	drawer.openMenuByName('setting_about');
}
function onCloseWindow(e) {
	$.win.removeEventListener('androidback', onAndroidBack);
	$.win.removeEventListener('open', onOpenWindow);
	$.win.removeEventListener('close', onCloseWindow);

	actionBar.release();
	
	Alloy.Globals.app = undefined;
	Alloy.Globals.appWindow._actionBar = undefined;
	Alloy.Globals.appWindow = undefined;
}
function onAndroidBack(e) {
	if (_.isFunction(actionBar.onAndroidback) && actionBar.onAndroidback(e)) return;
	$.win.close();
}

$.win.addEventListener('androidback', onAndroidBack);
$.win.addEventListener('open', onOpenWindow);
$.win.addEventListener('close', onCloseWindow);


Alloy.Globals.app = drawer;
Alloy.Globals.appWindow = $.win;
