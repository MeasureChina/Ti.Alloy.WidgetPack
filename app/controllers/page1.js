$.win._options = {
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
};


function onClick1(e) {
	Alloy.createWidget("com.tripvi.popup").openPopup({
		
	});
}
function onClick2(e) {
	Alloy.createWidget("com.tripvi.popup").openIndicator({
		
	});
}
function onClick3(e) {
	// Alloy.createWidget("com.tripvi.popup").openPopup({
	// 	
	// });
}


function onClick4(e) {
	var actionBar = $.win._actionBar || (Alloy.Globals.appWindow && Alloy.Globals.appWindow._actionBar);
	if (actionBar) {
		actionBar.beginActionMode({
			title: "Select Mode",
		});
	}
}
function onClick5(e) {
	var actionBar = $.win._actionBar || (Alloy.Globals.appWindow && Alloy.Globals.appWindow._actionBar);
	if (actionBar) {
		actionBar.beginActionMode({
			title: "Reorder Mode",
		});
	}
}
