

function getPhotos() {
	
	var AndroidMediaQuery = require('com.tripvi.mediaquery');
	
	var photos = AndroidMediaQuery.queryPhotosByOneDate(new Date("2013-08-26"));
	var rows = [];
	
	for (var i in photos) {
		var photo = photos[i];
		console.log( "(" + i + ") " + (new Date(photo.dateTaken)).toString());

		var row = Ti.UI.createTableViewRow({
			width: Ti.UI.FILL,
			height: Ti.UI.SIZE,
			layout: 'vertical',
		});

		var info = Ti.UI.createLabel({
			text: photo.id + ') ' + photo.path,
		});
		row.add(info);

		var info1 = Ti.UI.createLabel({
			text: "date - " + (new Date(photo.dateTaken)).toString(),
			// text: "date - " + photo.dateTaken,
		});
		row.add(info1);

		var info2 = Ti.UI.createLabel({
			text: photo.width + 'x' + photo.height,
		});
		row.add(info2);

		var info3 = Ti.UI.createLabel({
			text: photo.gpsMethod + ' ' + photo.lat + ', ' + photo.lon,
		});
		row.add(info3);

		var info4 = Ti.UI.createLabel({
			text: photo.exif_lat + ', ' + photo.exif_lon,
		});
		row.add(info4);

		var img = Ti.UI.createImageView({
			image: "file://" + photo.thumbnail,
			width: photo.thumbnail_width,
			height: photo.thumbnail_height,
		});

		if (photo.rotate == "1") {
			img.transform = Ti.UI.create2DMatrix().rotate(90);
		}

		row.add(img);

		rows.push(row);
	}
	
	return rows;
}

function createTableView(e) {
	var win = e.source;

	var table = Ti.UI.createTableView({});
	win.add(table);
	
	table.setData(getPhotos());
}

function onCloseWindow(e) {
	for(var child in e.source.getChildren()) {
		if (child._release) {
			e.source.remove(child);
			child._release();
			child = undefined;
		}
	}
	
	e.source.removeEventListener("open", createTableView);
	e.source.removeEventListener("close", onCloseWindow);
}

exports.createWindow = function(options) {
	
	options = options || {};
	
	var win = Ti.UI.createWindow({
		navBarHidden: true,
		backgroundColor: "#fff",
	})
	
	win.addEventListener("open", createTableView);
	win.addEventListener("close", onCloseWindow);
	
	return win;
}






