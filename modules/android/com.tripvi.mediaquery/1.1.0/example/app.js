// This is a test harness for your module
// You should do something interesting in this harness 
// to test out the module and to provide instructions 
// to users on how to use it by example.


// open a single window
var win = Ti.UI.createWindow({
	backgroundColor: 'white',
});

var albumButton = Ti.UI.createButton({
	top: "50dp",
	height: "70dp",
	width: "200dp",
	title: "album",
});
win.add(albumButton);

albumButton.addEventListener("click", function() {
	var newWin = require("album").createWindow();
	newWin.open();
});

var photoButton1 = Ti.UI.createButton({
	top: "150dp",
	height: "70dp",
	width: "200dp",
	title: "photo(Pagination)",
});
win.add(photoButton1);

photoButton1.addEventListener("click", function() {
	var newWin = require("photo").createWindow();
	newWin.open();
});

var photoButton2 = Ti.UI.createButton({
	top: "250dp",
	height: "70dp",
	width: "200dp",
	title: "photo(Date range)",
});
win.add(photoButton2);

photoButton2.addEventListener("click", function() {
	var newWin = require("photosByDate").createWindow();
	newWin.open();
});

var photoButton3 = Ti.UI.createButton({
	top: "350dp",
	height: "70dp",
	width: "200dp",
	title: "photo(One Date)",
});
win.add(photoButton3);

photoButton3.addEventListener("click", function() {
	var newWin = require("photosByOneDate").createWindow();
	newWin.open();
});

/*require('com.tripvi.mediaquery').queryPhotosByDate("2013-08-26", "2013-08-30");*/
/*require('com.tripvi.mediaquery').queryPhotosByOneDate("2013-09-26");*/

/*var photoButton2 = Ti.UI.createButton({
	top: "350dp",
	height: "100dp",
	width: "200dp",
	title: "photo(getThumbnail)",
});
win.add(photoButton2);

photoButton2.addEventListener("click", function() {
	var albumWin = require("photo").createWindow({mode: "getThumbnail"});
	albumWin.open();
});*/



win.open();
