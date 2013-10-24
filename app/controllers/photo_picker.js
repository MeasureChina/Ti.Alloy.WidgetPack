var args = arguments[0] || {};
var u = require('utility');
Alloy.Globals.makeLayoutFit($);




// arguments 파싱하고 적용
// controller가 처음 만들어질때 1번만 실행됨
$._remember_list_album = args.remember_list_album;
$._mode = args.mode;

// 모든 variable은 $._로 시작함
// view는 _없이 $.로 시작해도 괜찮다
$._media_query_module = require('com.tripvi.mediaquery');

$._last_album_id = Ti.App.Properties.getString('config.last_album_id') || undefined;
$._albums = undefined;

$._page = undefined;
$._per_page = 50;
$._page_end = false;

$._current_section_row = undefined;

// 선택된 사진들 저장
$._selected_photos = {};

// 선택된 앰범의 사진들을 보고있는지 유저가 선택한 사진들을 보고있는지 알기위함
$._show_mode = "album"; // album or selected



/**
 *	model
 *
 */
// model의 값을 변경시키는 모든 case는 이곳에 함수를 만든다.
function queryAlbums() {
	$._albums = _.clone($._media_query_module.queryAlbumList());
	
	// $._last_album_id가 없거나 저장해놓은 앨범이 존재하지 않으면 첫번째 앨범을 last album id로 저장
	if (!$._last_album_id || ($._last_album_id && !_.find($._albums, function(album) { return album.id == $._last_album_id }))) { 
		$._last_album_id = _.first(_.toArray($._albums))["id"];
	}
}

function queryPhotos() {
	
	$._show_mode = "album";
	
	$._page = $._page || 1;
	
	var photos = $._media_query_module.queryPhotosByAlbumId($._last_album_id, (($._page-1) * $._per_page), $._per_page);
	groupingPostAndUpdateView(_.clone(photos));
	
	photos = undefined;
}

function showSelectedPhotos() {
	
	if (_.size($._selected_photos) <= 0) {
		alert("최소한 하나의 사진이 선택되어있어야 합니다.");
		return;
	}
	
	$._show_mode = "selected"
	
	
	resetListView();
	groupingPostAndUpdateView($._selected_photos);
}



/**
 *	model: binding
 *
 */
// model-view binding에 관련된 함수들은 이곳에



/**
 *	UI:
 *
 */
// view를 초기화하는 모든 코드
if ($._mode == "single") {
	$.toolbar.visible = false;
	$.photosWrapper.bottom = 0;
}

function openCropIntent(data) {

	var intent = Ti.Android.createIntent({
		action: "com.android.camera.action.CROP",
		type: 'image/*',
		data: data,
	});
	intent.putExtra("aspectX", 600);
	intent.putExtra("aspectY", 234);
	intent.putExtra("scale", true);
	intent.putExtra("noFaceDetection", true);
	intent.putExtra("return-data", false);
	
	var tmpfile = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory, "temp" + new Date().getTime() + "" + Math.round(Math.random() * 1000) + ".jpeg");
	intent.putExtraUri("output", tmpfile.nativePath);

	var activity = $.win.getActivity();

	activity.startActivityForResult(intent, function(param) {
		Ti.API.info('  cropped image was return: ' + param.resultCode);
		
		if (param.resultCode == Ti.Android.RESULT_OK) {
			// TODO: 
			console.log("path :: " + tmpfile.read().nativePath);
			$.trigger('select:cover_photo', { cover_photo: tmpfile.read().nativePath });
			// setTimeout(_.bind(function() {
			$.win.close();
			// }, $), 200);
		} else {
			Ti.API.info('  activity return ERROR with resultCode: ' + param.resultCode);
		}
		
		// tmpfile.deleteFile();
		tmpfile = undefined;
		// $.win.close();
	});

}

function getCurrentSectionRow() {
	return _.clone($._current_section_row);
}

function setCurrentSectionRow(section) {
	$._current_section_row = _.clone(section);
}


// view를 변경하는 모든 코드
function groupingPostAndUpdateView(photos) {
	$._page_end = _.size(photos) < $._per_page;
	
	if ($._show_mode == "selected") {
		photos = _.sortBy(photos, function(photo) { return photo["dateTaken"]; });
		photos.reverse();
	}
	
	var groups = _.groupBy(photos, function(photo) { return moment(photo["dateTaken"]).format("MMMM D, YYYY") });
	
	_.each(groups, function(group, date) {
		
		var section = $.photos.sections[0];
		var items = [];
		
		// section row가 없으면 생성
		var currentSectionRow = getCurrentSectionRow();
		if (!currentSectionRow || (currentSectionRow._date != date)) {
			setCurrentSectionRow({
				template: 'section',
				dateTaken: { text: date },
				_date: date,
			});
			
			items.push(getCurrentSectionRow());
		}
		// 아니면 마지막 row의 사진이 4장 미만인지 검사
		else {
			var last_item = _.last(section.getItems());
			
			// 마지막 row에 사진이 4장 미민이면 삭제 후 사진 정보를 배열에 넣고 다시 생성
			if (_.isNumber(last_item["photos_count"]) && last_item["photos_count"] < 4) {
				section.deleteItemsAt(section.items.length-1, 1);
				
				for(var i=last_item["photos_count"]; i > 0; i--) {
					group.unshift(last_item["photoInfo" + i]);
				}
			}
		}
		
		var rowCount = Math.ceil(group.length / 4);
		
		for (var i=0; i<rowCount; i++) {
			var item = { template: 'photos' };
			var photos_count = 4;

			for (var j=0; j<4; j++) {
				var photo = group[4*i+j];
				if (photo) {
					item["photoWrapper"+(j+1)] = { visible: true };
					item["photo"+(j+1)] = { image: "file://" + photo["thumbnail"], width: photo["thumbnail_width"], height: photo["thumbnail_height"] };
					
					// photo data
					item["photoInfo"+(j+1)] = photo;
					
					// 선택된 사진이 기억되어있는 경우 그 여부에 따라 보여줄지 결정
					item["check"+(j+1)] = { visible: !!$._selected_photos[photo["id"]] };
					
					// fill to container
					u.fill_to_container({ width: u.resized_value(70), height: u.resized_value(70) }, item["photo"+(j+1)]);
				}
				else {
					photos_count -= 1;
					item["photoWrapper"+(j+1)] = { visible: false };
					item["photo"+(j+1)] = { visible: false };
					item["check"+(j+1)] = { visible: false };
				}
			}	
			item["photos_count"] = photos_count;
			
			items.push(item);
		}
		section.appendItems(items);
	});
	
	
}

function releaseAlbumList() {
	if ($ && $.albums)  {
		if ($.albums.data && $.albums.data[0]) {
			var rows = $.albums.data[0].rows;
			_.each(rows, function(row) {
				if (row._release) row._release();
			})
			rows = undefined;
		}
		
		$.albums.setData([]);
	}
}

// 선택된 앨범 체크
function checkRows() {
	if ($ && $.albums)  {
		if ($.albums.data && $.albums.data[0]){
			var rows = $.albums.data[0].rows;
			_.each(rows, function(row) {
				if (row._release) row._checkSelectedAlbum();
			})
		}
	}
}

// 앨범을 보여줄 때마다 새로 쿼리해서 앨범 리스트 띄운다
function showAlbums() {
	queryAlbums();
	releaseAlbumList();
	
	var rows = [];
	_.each($._albums, function(album) {
		
		var size = 40;
		
		var row = Ti.UI.createTableViewRow({
			width: Ti.UI.FILL,
			height: size,
			_id: album["id"],
		})
		
		var wrapper = Ti.UI.createView({
			width: Ti.UI.FILL, height: Ti.UI.FILL,
		});
		row.add(wrapper);
		
		var imageWrapper = Ti.UI.createView({
			left: 0,
			width: size,
			height: size,
		})
		wrapper.add(imageWrapper);
		
		var image = Ti.UI.createImageView({
			width: size,
			height: (album.thumbnail_height * size / album.thumbnail_width),
			image: "file://" + album.thumbnail,
		});
		imageWrapper.add(image);
		
		var title = Ti.UI.createLabel({
			left: size + 10,
			text: album.name + " (" + album.photos_count + ")",
			font: {fontSize: 15, fontWeight: "bold"},
			color: "#000",
		});
		wrapper.add(title);
		
		var check = Ti.UI.createImageView({
			_id: "check",
			right: 15,
			width: 15, height: 15,
			backgroundColor: "#f00",
			visible: false,
		})
		wrapper.add(check);
		
		require('utility').make_layout_fit([row, imageWrapper, image, title, check]);
		
		row._checkSelectedAlbum = function() {
			var topView = row.getChildren()[0];
			if (topView){
				var check_icon = _.find(topView.getChildren(), function(child) { return child._id == "check"; });
				if (check_icon) {
					check_icon.visible = ($._last_album_id == row._id);
				}
			}
		}
		
		row._release = function() {
			row._checkSelectedAlbum = undefined;
			row = undefined;
		}
		
		rows.push(row);
	});
	
	$.albums.setData(rows);
	checkRows();
	
	$.albumsWrapper.visible = true;
}

function hideAlbums() {
	$.albumsWrapper.visible = false;
}

function isOpenedAlbum() {
	return $.albumsWrapper.visible;
}

function resetListView() {
	if ($ && $.photos){
		var section = $.photos.sections[0];
		section.setItems([]);
		
		$._current_section_row = undefined;
		$._page = undefined;
		$._page_end = false;
	}
}

function releaseListView() {
	var section = $.photos.sections[0];
	section.deleteItemsAt(0, section.items.length);
	
	$.photos.deleteSectionAt(0);
}

function countSelectedPhotos() {
	$.countLabel.text = ($._selected_photos ? _.size($._selected_photos) : 0) + " photos";
}

function clearSelectedPhotos() {
	var section = $.photos.sections[0];
	
	$._selected_photos = {};
	var items = [];
	_.each(section.getItems(), function(data, index) {
		if (data["template"] == "photos") {
			for(var i=0; i < 4; i++) {
				if (data["check"+(i+1)]["visible"]) {
					data["check"+(i+1)] = { visible: false };
					// $._selected_photos = _.omit($._selected_photos, data["photoInfo"+(i+1)]["id"]);
				}	
			}
		}
		items.push(data);
	});
	
	section.setItems(items);
}




/**
 *	UI: Events
 *
 */
// XML에서 정의된 모든 이벤트 핸들러

// for pagination
function onScrollListView(e) {
	// firstVisibleItem == 0이면 맨위에 다다른것임
	if (e.firstVisibleItem == 0) {
		onAppearHeader();
	}
	// firstVisibleItem + visibleItemCount == totalItemCount이면 맨 아래에 다다른것임
	else if (e.firstVisibleItem + e.visibleItemCount >= e.totalItemCount) {
		onAppearFooter();
	}
	//
	else {
		
	}
}

function onAppearHeader() {
	
}

function onAppearFooter() {
	
	if ($._show_mode == "selected") return;
	if ($._delay) return;
	if ($._page_end) {
		Ti.API.info("page end!!!");
		return;
	}
	
	$._delay = true;
	setTimeout(_.bind(function() {
		this._delay = false;
	}, $), 500);
	
	// pagination
	$._page += 1;
	queryPhotos();
}


function onItemclick(e) {
	if (!e.bindId) return;
	
	e.cancelBubble = true;
	e.source.touchEnabled = false;
	setTimeout(_.bind(function() { this.touchEnabled = false }, e.source), 1000);
	
	//
	var index = e.itemIndex;
	var section = e.section;
	var data = section.getItemAt(index);

	//
	var num = e.bindId.replace(/[a-zA-Z]/ig, "");
	data["check"+num] = { visible: !data["check"+num]["visible"] };
	
	var photo_info = data["photoInfo"+num];
	
	if ($._mode == "single") {
		openCropIntent("file://" + photo_info["path"]);
	}
	else {
		if (data["check"+num]["visible"]) {
			$._selected_photos[photo_info["id"]] = photo_info;
		}
		else {
			$._selected_photos = _.omit($._selected_photos, photo_info["id"]);
		}

		countSelectedPhotos();

		//
		section.replaceItemsAt(index, 1, [data]);
	}
}


function onClickClear(e) {
	e.source.touchEnabled = false; // 여러번 클릭을 막기위한 코드.  click/singletap 이벤트에 대해 넣어둔다.
	setTimeout(_.bind(function() { this.touchEnabled = true }, e.source), 1000);
	
	clearSelectedPhotos();
	
	if ($._show_mode == "selected") {
		resetListView();
		queryPhotos();
	}
	
	countSelectedPhotos();
}

function onClickSelect(e) {
	e.source.touchEnabled = false; // 여러번 클릭을 막기위한 코드.  click/singletap 이벤트에 대해 넣어둔다.
	setTimeout(_.bind(function() { this.touchEnabled = true }, e.source), 1000);

	$.trigger("select:photos", { photos: $._selected_photos });
	setTimeout(_.bind(function() {
		this.win.close();
	}, $), 200);
}

function onClickBar(e) {
	e.source.touchEnabled = false; // 여러번 클릭을 막기위한 코드.  click/singletap 이벤트에 대해 넣어둔다.
	setTimeout(_.bind(function() { this.touchEnabled = true }, e.source), 1000);
	
	if (!$.albumsWrapper.visible) {
		showAlbums();
	}
}

function onClickAlbumsWrapper(e) {
	e.source.touchEnabled = false; // 여러번 클릭을 막기위한 코드.  click/singletap 이벤트에 대해 넣어둔다.
	setTimeout(_.bind(function() { this.touchEnabled = true }, e.source), 1000);
	
	if (e.source.id == "albumsWrapper") {
		hideAlbums();
		releaseAlbumList();
	}
}

function onClickAlbums(e) {
	e.source.touchEnabled = false; // 여러번 클릭을 막기위한 코드.  click/singletap 이벤트에 대해 넣어둔다.
	setTimeout(_.bind(function() { this.touchEnabled = true }, e.source), 1000);
	
	$._last_album_id = e.row._id;
	
	if ($._remember_list_album) {
		Ti.App.Properties.setString('config.last_album_id', $._last_album_id);
	}

/*	checkRows();*/
	setTimeout(function() {
		resetListView(); 
		queryPhotos();
		hideAlbums(); 
	}, 100);
}

function onClickCount(e) {
	e.source.touchEnabled = false; // 여러번 클릭을 막기위한 코드.  click/singletap 이벤트에 대해 넣어둔다.
	setTimeout(_.bind(function() { this.touchEnabled = true }, e.source), 1000);
	
	showSelectedPhotos();
}




/**
 *	Resource & Window Lifecycle Management
 *
 */
function onOpenWindow(e) {

	// model 및 module내 변수들을 준비
	
	
	// view, subview, submodules 준비
	// 화면을 만드는 코드가 data에 의해 외부에서 빈번하게 변하는 경우 exports.updateView()에 작성한다.
	
	// 
	queryAlbums();
	
	// 앨범 쿼리해서 가져온 첫번째 앨범 id 혹은 정해진 앨범 id로 사진들 쿼리
	queryPhotos();
	
	
	// model에 대한 event handlers
	// 모듈내부에서 model 및 data의 변화에 따라 view가 변경되는 모든 컨트롤 로직들은 model의 event listener로 만들어져야함
	// - 외부에서 현재 controller모듈의 data값을 읽거나 view를 강제로 업데이트 하는 경우에는 exports.updateView() 등에서 처리
	
	
}

function onCloseWindow(e) {

	// 모델 이벤트 해제

	// XML에서 정의된 이벤트 해제
	$.bar.removeEventListener("click", onClickBar);
	$.albumsWrapper.removeEventListener("click", onClickAlbumsWrapper);
	$.albums.removeEventListener("click", onClickAlbums);
	$.photos.removeEventListener("itemclick", onItemclick);
	$.photos.removeEventListener("scroll", onScrollListView);
	$.clearButton.removeEventListener("click", onClickClear);
	$.countButton.removeEventListener("click", onClickCount);
	$.selectButton.removeEventListener("click", onClickSelect);
	
	// XML에서 정의된 이벤트 해제
	$.win.removeEventListener('open', onOpenWindow);
	$.win.removeEventListener('close', onCloseWindow);
	$.win.removeEventListener('androidback', onAndroidBack);
	// clear model-view bindings
	$.off();
	$.destroy();


	// 모델 및 변수 제거
	// releaseListView();
	
	$._media_query_module = undefined;
	$._last_album_id = undefined;
	$._albums = undefined;
	$._current_section_row = undefined;
	$._show_mode = undefined;
	$._selected_photos = undefined;

	// remove view elements
	require('utility').releaseController($);
	$ = undefined;
}

function onAndroidBack() {
	if (isOpenedAlbum()) {
		hideAlbums();
	}
	else if($._show_mode == "selected") {
		resetListView();
		queryPhotos();
	}
	else {
		$.win.close();
	}
}



///////////////////////////////////////////////

$.win.addEventListener('open', onOpenWindow);
$.win.addEventListener('close', onCloseWindow);
$.win.addEventListener('androidback', onAndroidBack);













