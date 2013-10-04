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



$.win.open();
