var args = arguments[0] || {};
var u = require('utility');
Alloy.Globals.makeLayoutFit($);




// arguments 파싱하고 적용
// controller가 처음 만들어질때 1번만 실행됨

// 모든 variable은 $._로 시작함
// view는 _없이 $.로 시작해도 괜찮다
$._media_query_module = require('com.tripvi.mediaquery');
$._last_album_id = Ti.App.Properties.getString('config.last_album_id') || undefined;
$._albums = undefined;


/**
 *	model
 *
 */
// model의 값을 변경시키는 모든 case는 이곳에 함수를 만든다.
function queryAlbums() {
	$._albums = $._media_query_module.queryAlbumList();
	
	// $._last_album_id가 없거나 저장해놓은 앨범이 존재하지 않으면 첫번째 앨범을 last album id로 저장
	if (!$._last_album_id || ($._last_album_id && !_.find($._albums, function(album) { return album.id == $._last_album_id }))) { 
		$._last_album_id = _.first(_.toArray($._albums))["id"];
	}
	
	console.log("last album id :: " + $._last_album_id);
	
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


// view를 변경하는 모든 코드
function releaseAlbumList() {
	if ($ && $.albums)  {
		if ($.albums.data && $.albums.data[0]){
			var rows = $.albums.data[0].rows;
			_.each(rows, function(row) {
				if (row._release) row._release();
			})
			rows = undefined;
		}
		$.albums.setData([]);
/*		$._table.removeEventListener('scroll', pagination);*/
	}
}

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




/**
 *	UI: Events
 *
 */
// XML에서 정의된 모든 이벤트 핸들러
function onClickSubmit(e) {
	e.source.touchEnabled = false; // 여러번 클릭을 막기위한 코드.  click/singletap 이벤트에 대해 넣어둔다.
	setTimeout(_.bind(function() { this.touchEnabled = true }, e.source), 1000);
	
	
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
	Ti.App.Properties.setString('config.last_album_id', $._last_album_id);
	
/*	checkRows();*/
	setTimeout(function() { hideAlbums(); }, 100);
}




/**
 *	Resource & Window Lifecycle Management
 *
 */
function onOpenWindow(e) {

	// model 및 module내 변수들을 준비
	
	
	// view, subview, submodules 준비
	// 화면을 만드는 코드가 data에 의해 외부에서 빈번하게 변하는 경우 exports.updateView()에 작성한다.
	queryAlbums();
	
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
	
	// XML에서 정의된 이벤트 해제
	$.win.removeEventListener('open', onOpenWindow);
	$.win.removeEventListener('close', onCloseWindow);
	// clear model-view bindings
	$.destroy();


	// 모델 및 변수 제거

	// remove view elements
	require('utility').releaseController($);
	$ = undefined;
}




///////////////////////////////////////////////

$.win.addEventListener('open', onOpenWindow);
$.win.addEventListener('close', onCloseWindow);
