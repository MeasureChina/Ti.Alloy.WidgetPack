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

$.toolbar1.init({
	leftActions: [
		{
			title: "+add",
			callback: function() { alert("+add") },
		}
	],
	rightActions: [
		{
			title: "delete",
			callback: function() { alert("delete") },
		}
	],
	visible: false,
});

$.toolbar2.init({
	leftActions: [
		{
			title: "done reordering",
			callback: function() { $.toolbar2.openIndicator() },
		}
	],
	visible: false,
});

function showToolbar1() {
	$.toolbar1.show();
	$.toolbar2.hide();
	$.container.bottom = "48";
}
function showToolbar2() {
	$.toolbar2.show();
	$.toolbar1.hide();
	$.container.bottom = "48";
}
function hideAllToolbar() {
	$.toolbar1.hide();
	$.toolbar2.hide();
	$.container.bottom = "0";
}



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
			onActionFinish: hideAllToolbar,
		});
	}
	
	showToolbar1();
}
function onClick5(e) {
	var actionBar = $.win._actionBar || (Alloy.Globals.appWindow && Alloy.Globals.appWindow._actionBar);
	if (actionBar) {
		actionBar.beginActionMode({
			title: "Reorder Mode",
			onActionFinish: hideAllToolbar,
		});
	}
	
	showToolbar2();
}


function onClick6(e) {
	showToolbar1();
}

