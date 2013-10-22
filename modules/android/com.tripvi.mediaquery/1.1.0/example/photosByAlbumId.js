

function getPhotos(id, page, perPage) {
	
	var AndroidMediaQuery = require('com.tripvi.mediaquery');
	
	var photos = AndroidMediaQuery.queryPhotosByAlbumId(id, (page * perPage), perPage); // offset, limit
	var rows = [];
	var count = 0;
	
	for (var i in photos) {
		
		count += 1;
		
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
	
	console.log("");
	console.log("page :: " + (page+1) + " / count :: " + count);
	console.log("");
	
	return {
		rows: rows,
		end: (count < perPage),
	};
}

function pagination(e) {
	if (e.source._delay) return;
	if (e.source._pageEnd) return;
	
	if (e.firstVisibleItem + e.visibleItemCount >= e.totalItemCount) {
		e.source._delay = true;
		setTimeout(function() {
			e.source._delay = false;
		}, 500);
		
		var data = getPhotos(e.source._id, e.source.page, e.source.perPage);
		e.source.appendRow(data["rows"]);
		e.source.page += 1;
		e.source._pageEnd = data["end"];
	}
}

function createTableView(e) {
	var win = e.source;

	var table = Ti.UI.createTableView({
		page: 0,
		perPage: 10,
		_pageEnd: false,
		_delay: false,
		_id: e.source._id,
	});
	win.add(table);
	
	table.addEventListener("scroll", pagination);
	table._release = function() {
		table.removeEventListener("scroll", pagination);
		table = undefined;
	}
	
	var data = getPhotos(table._id, table.page, table.perPage);
	table.appendRow(data["rows"]);
	table.page += 1;
	table._pageEnd = data["end"];
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
		_id: options._id,
	})
	
	win.addEventListener("open", createTableView);
	win.addEventListener("close", onCloseWindow);
	
	return win;
}






