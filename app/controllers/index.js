var drawer = Alloy.createWidget("com.tripvi.navigationDrawer");
drawer.init($.win, {
	navigation: [
		{
			section: 'default',
			title: null, // no header view
			items: [
				{
					name: 'setting_about',
					title: "Bookmill",
					icon: '/appicon.png',
					window: 'page1',
				},
				{
					name: 'home',
					title: "Home",
					icon: '/appicon.png',
					window: 'page2',
					selectedColor: "#844c96",
				},
				{
					name: 'person_index',
					title: "명사의 서재",
					icon: '/appicon.png',
					window: 'page3',
					selectedColor: "#844c96",
				},
			],
		},
	]
});

drawer.on('menuselect', function(e) {
	$._lastWindowTitle = e.title;
});
drawer.on('open', function(e) {
	$._lastWindowTitle = $._lastWindowTitle || actionBar.getTitle();
	actionBar.setTitle("MENU");
});
drawer.on('close', function(e) {
	actionBar.setTitle($._lastWindowTitle || $.win.title);
	$._lastWindowTitle = undefined;
});
drawer.on('drawerslide', function(e) {
	actionBar.onDrawerSlide(e.offset);
});


var actionBar = Alloy.createWidget("com.tripvi.actionBar");
actionBar.init($.win, {
	rootWindow: true,
	useDrawerMenu: true,
	menu: [
		{
			title: "Search",
			icon: "/appicon.png",
			type: "searchview",
		},
		{
			title: "New Item",
			icon: "/appicon.png",
			showAsAction: Ti.Android.SHOW_AS_ACTION_COLLAPSE_ACTION_VIEW,
		},
		{
			title: "Edit Item",
			icon: "/appicon.png",
			showAsAction: Ti.Android.SHOW_AS_ACTION_COLLAPSE_ACTION_VIEW,
		},
		{
			title: "Camera",
			showAsAction: Ti.Android.SHOW_AS_ACTION_COLLAPSE_ACTION_VIEW,
		},
		{
			title: "Share",
			showAsAction: Ti.Android.SHOW_AS_ACTION_COLLAPSE_ACTION_VIEW,
		},
		{
			title: "Setting",
			showAsAction: Ti.Android.SHOW_AS_ACTION_COLLAPSE_ACTION_VIEW,
		},
	],
});


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
