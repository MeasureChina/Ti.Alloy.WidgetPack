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
drawer.on('open', function(e) {
	// actionbar title 변경
	$._lastWindowTitle = $._lastWindowTitle || actionBar.getTitle();
	actionBar.setTitle("MENU");
	// actions 감추기
	actionBar.hideActionItems();
});
drawer.on('close', function(e) {
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
actionBar.init($.win);


$.win.addEventListener("actionbarhome", function() {
	drawer.toggleLeftDrawer();
});


function onOpenWindow(e) {
	
}
function onCloseWindow(e) {
	$.win.removeEventListener('androidback', onAndroidBack);
	$.win.removeEventListener('open', onOpenWindow);
	$.win.removeEventListener('close', onCloseWindow);
}
function onAndroidBack(e) {
	$.win.close();
}

$.win.addEventListener('androidback', onAndroidBack);
$.win.addEventListener('open', onOpenWindow);
$.win.addEventListener('close', onCloseWindow);



$.win.open();
