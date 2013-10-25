
function openPhotosByAlbum(e) {
	console.log("e.row._id :: " + e.row._id);
	
	var newWin = require("photosByAlbumId").createWindow({
		_id: e.row._id,
	});
	newWin.open();
}

function getPhotos(e) {
	
	var AndroidMediaQuery = require('com.tripvi.mediaquery');
	var win = e.source;

	var table = Ti.UI.createTableView();
	win.add(table);
	
	table.addEventListener("click", openPhotosByAlbum);
	table._release = function() {
		table.removeEventListener("click", openPhotosByAlbum);
		table = undefined;
	}
	
	var albums = AndroidMediaQuery.queryAlbumList();
	var rows = [];

	for (var i in albums) {
		
		var album = albums[i];
		
		console.log(new Date(album["dateTaken"]));
		
		var row = Ti.UI.createTableViewRow({
			height: "75dp",
			_id: album.id,
		});
		
		var wrapper = Ti.UI.createView({
			width: Ti.UI.FILL, height: Ti.UI.FILL,
		});
		row.add(wrapper);
		
		var imageWrapper = Ti.UI.createView({
			left: 0,
			width: "75dp",
			height: "75dp",
		})
		wrapper.add(imageWrapper);
		
		var image = Ti.UI.createImageView({
			width: "75dp",
			height: (album.thumbnail_height * 75 / album.thumbnail_width) + "dp",
			image: "file://" + album.thumbnail,
		});
		imageWrapper.add(image);
		
		var title = Ti.UI.createLabel({
			left: "85dp",
			text: album.name + " (" + album.photos_count + ")",
			font: {fontSize: "15dp", fontWeight: "bold"},
			color: "#000",
		});
		wrapper.add(title);
		
		rows.push(row);
	}

	table.setData(rows);
}

function onCloseWindow(e) {
	
	for(var child in e.source.getChildren()) {
		if (child._release) {
			e.source.remove(child);
			child._release();
			child = undefined;
		}
	}
	
	e.source.addEventListener("open", getPhotos);
	e.source.addEventListener("close", onCloseWindow);
}

exports.createWindow = function() {
	
	var win = Ti.UI.createWindow({
		navBarHidden: true,
		backgroundColor: "#fff"
	})
	
	win.addEventListener("open", getPhotos);
	win.addEventListener("close", onCloseWindow);
	
	return win;
}