var _ = require('alloy/underscore')._;
var Alloy = require('alloy');

var ALLOY_DB_DEFAULT = '_alloy_';
var ALLOY_ID_DEFAULT = 'alloy_id';
var ALLOY_MODIFIED_DEFAULT = 'modified_at'

function S4() {
	return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

function guid() {
	return (S4()+S4()+'-'+S4()+'-'+S4()+'-'+S4()+'-'+S4()+S4()+S4());
}

var cache = {
	config: {},
	Model: {}
};

// SOURCE: https://github.com/appcelerator/alloy/blob/master/Alloy/lib/alloy/sync/sql.js
// 변경사항 추적해야함 - sep 18, 2013

// The sql-specific migration object, which is the main parameter
// to the up() and down() migration functions.
//
// db            The database handle for migration processing. Do not open
//               or close this as it is a running transaction that ensures
//               data integrity during the migration process.
// dbname        The name of the SQLite database for this model.
// table         The name of the SQLite table for this model.
// idAttribute   The unique ID column for this model, which is
//               mapped back to Backbone.js for its update and
//               delete operations.
function Migrator(config, transactionDb) {
	this.db = transactionDb;
	this.dbname = config.adapter.db_name;
	this.table = config.adapter.collection_name;
	this.idAttribute = config.adapter.idAttribute;

	//TODO: normalize columns at compile time - https://jira.appcelerator.org/browse/ALOY-222
	this.column = function(name) {
		// split into parts to keep additional column characteristics like
		// autoincrement, primary key, etc...
		var parts = name.split(/\s+/);
		var type = parts[0];
		switch(type.toLowerCase()) {
			case 'string':
			case 'varchar':
			case 'date':
			case 'datetime':
				Ti.API.warn('"' + type + '" is not a valid sqlite field, using TEXT instead');
			case 'text':
				type = 'TEXT';
				break;
			case 'int':
			case 'tinyint':
			case 'smallint':
			case 'bigint':
			case 'boolean':
				Ti.API.warn('"' + type + '" is not a valid sqlite field, using INTEGER instead');
			case 'integer':
				type = 'INTEGER';
				break;
			case 'double':
			case 'float':
			case 'decimal':
			case 'number':
				Ti.API.warn('"' + name + '" is not a valid sqlite field, using REAL instead');
			case 'real':
				type = 'REAL';
				break;
			case 'blob':
				type = 'BLOB';
				break;
			case 'null':
				type = 'NULL';
				break;
			default:
				type = 'TEXT';
				break;
		}
		parts[0] = type;
		return parts.join(' ');
	};

	this.createTable = function(config) {
		// compose the create query
		var columns = [];
		var found = false;
		for (var k in config.columns) {
			if (k === this.idAttribute) { found = true; }
			columns.push(k + " " + this.column(config.columns[k]));
		}

		// add the id field if it wasn't specified
		if (!found && this.idAttribute === ALLOY_ID_DEFAULT) {
			columns.push(ALLOY_ID_DEFAULT + ' TEXT UNIQUE');
		}
		var sql = 'CREATE TABLE IF NOT EXISTS ' + this.table + ' ( ' + columns.join(',') + ')';

		// execute the create
		this.db.execute(sql);
	};

	this.dropTable = function() {
		this.db.execute('DROP TABLE IF EXISTS ' + this.table);
	};

	this.insertRow = function(columnValues) {
		var columns = [];
		var values = [];
		var qs = [];

		// get arrays of column names, values, and value placeholders
		var found = false;
		for (var key in columnValues) {
			if (key === this.idAttribute) { found = true; }
			columns.push(key);
			values.push(columnValues[key]);
			qs.push('?');
		}

		// add the id field if it wasn't specified
		if (!found && this.idAttribute === ALLOY_ID_DEFAULT) {
			columns.push(this.idAttribute);
			values.push(guid());
			qs.push('?');
		}

		// construct and execute the query
		this.db.execute('INSERT INTO ' + this.table + ' (' + columns.join(',') + ') VALUES (' + qs.join(',') + ');', values);
	};

	this.deleteRow = function(columns) {
		var sql = 'DELETE FROM ' + this.table;
		var keys = _.keys(columns);
		var len = keys.length;
		var conditions = [];
		var values = [];

		// construct the where clause, if necessary
		if (len) { sql += ' WHERE '; }
		for (var i = 0; i < len; i++) {
			conditions.push(keys[i] + ' = ?');
			values.push(columns[keys[i]]);
		}
		sql += conditions.join(' AND ');

		// execute the delete
		this.db.execute(sql, values);
	};
}

// http network object
//
// options	timeout 	in milliseconds
//			method		get, post, put, delete
//			path
//			headers
//			data		post data
//			ssl
//
// callback	success
//			code
//			data
//			responseText
//			responseJSON
//			offline
//
function API(options, callback) {
	// testing code
	if (options.stub) {
		callback({
			success: true,
			code: 200,
			responseText: options.stub,
			responseJSON: options.stub,
		});
		return;
	}
	
	if (Ti.Network.online) {
		var xhr = Ti.Network.createHTTPClient({
			timeout : options.timeout || 7000
		});

		// rest api host
		var url = Alloy.Globals.host + options.path;
		if (options.ssl) {
			url = url.replace(/^http:\/\//, "https://");
			xhr.validatesSecureCertificate = false;
		}

		xhr.open(options.method, url);

		xhr.onload = function() {
			var responseJSON, success = true, error;
			if (xhr.responseText && xhr.responseText.trim() != "") {
				try {
					responseJSON = JSON.parse(xhr.responseText);
				} catch (e) {
					Ti.API.error("API ERROR:  " + e.message);
					Ti.API.error(xhr.responseText);
					success = false;
					error = e.message;
				}
			}
			callback({
				success: success,
				code: xhr.status,
				data: error,
				responseText: xhr.responseText || null,
				responseJSON: responseJSON || null,
			});
		};
		xhr.onerror = function() {
			var responseJSON, error;
			try {
				responseJSON = JSON.parse(xhr.responseText);
			} catch (e) {
				error = e.message;
			}

			Ti.API.error("API ERROR:  " + xhr.status);
			Ti.API.error(xhr.responseText);
			
			callback({
				success: false,
				code: xhr.status,
				data: error,
				responseText: xhr.responseText || null,
				responseJSON: responseJSON || null,
			});
		};

		// authentication token
		var authToken = Alloy.Globals.readFromSession && Alloy.Globals.readFromSession("auth_token");
		if (authToken) {
			xhr.setRequestHeader("X-Auth-Token", authToken);
		}
		// current language
		xhr.setRequestHeader("X-Language", Ti.Locale.currentLanguage);
		// content type
		xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		// custom
		for (var header in options.headers) {
			xhr.setRequestHeader(header, options.headers[header]);
		}
		
		xhr.send(JSON.stringify(options.data) || null);
    }
	else {
		// offline
		callback({
			success: false,
			responseText: null,
			offline: true
		});
	}
}

// model.config		debug
//					modifiedColumn
//					rootNode
//					name
// 
// dual 모드 시나리오 (remote api에는 실제 데이터, sql은 로컬 캐쉬처럼 동작한다고 생각)
//	- sql에만 Read/Write
//	- api로만 Read/Write
//	- sql에서 Read하고 api에서 Read가 성공하면 sql 업데이트하고 다시 화면 업데이트
//	- api로 Write 성공한 경우에만 sql에 Write
//	- sql에 Write하고 api에 Write하고 성공할때까지 poll & retry
//
function Sync(method, model, opts) {
    var table = model.config.adapter.collection_name,
		columns = model.config.columns,
		dbName = model.config.adapter.db_name || ALLOY_DB_DEFAULT,
		nodeName = model.config.adapter.nodeName || model.config.adapter.collection_name,
		rootNode = model.config.adapter.rootNode || model.config.adapter.collection_name + "s",
		urlRoot = model.config.urlRoot || "/" + model.config.adapter.collection_name + "s",
		resp = null,
		db, sql;

	var DEBUG = model.config.debug;
	var modifiedColumn = model.config.adapter.modifiedColumn || ALLOY_MODIFIED_DEFAULT;
	
	// api			api만 사용
	// transaction	sql, api 모두 사용. 다만 write시 api가 성공해야 sql에 저장함
	// active		sql, api 모두 사용. 먼저 sql에 write하고 api에 계속 sync 시도함
	// 
	// 개별 model마다 따로 지정할수있고, default값으로 model.config 참조
	var syncMode = model.syncMode || model.config.adapter.syncMode || "api";
	var useAPI = true;
	var useSQL = (syncMode == "transaction" || syncMode == "active");

	var HTTP_METHODS = {
		create: 'POST',
		read: 'GET',
		update: 'PUT',
		delete: 'DELETE',
	};
	
	var httpMethod = HTTP_METHODS[method];
	var params = _.extend({}, opts);
	params.method = httpMethod;
	params.headers = params.headers || {};
	if (model.config.hasOwnProperty("headers")) {
		for (header in model.config.headers) {
			params.headers[header] = model.config.headers[header];
		}
	}
	params.stub = model.stub; // test stub
	
	// loading 이벤트 - 주로 indicator 표시를 위해 사용
	model.trigger("loading", {
		method: method, 
		params: model.params, 
		pagination: (method == 'read' && (model.params && parseInt(model.params.page) > 0)) // pagination인 경우
	});
	
	
	switch (method) {
		case 'read':
			// read는 index와 show가 함께 사용함. index는 Collection, show는 Model을 생성하는데
			// model.id의 유무로 Collection인지 체크 가능
			params.path = makeResourcePath(urlRoot, model.params, model.attributes, model.id);
			
			Ti.API.info("[GET]  " + params.path);
			
			// 먼저 sql에서 읽어들이고
			if (useSQL) {
				var data = readSQL();
				if (DEBUG) {
					Ti.API.info("readSQL() result:");
					TRACE_JSON(data);
				}
				_.isFunction(params.success) && params.success(data);
				model.trigger("fetch", { localData: true });
			}
			
			// api에서 읽어들인값을 sql에 반영
			API(params, function(response) {
				if (response.success) {
					var resp = unwrapWithRootNode(response.responseJSON);
					if (DEBUG) {
						Ti.API.info("API() response:");
						TRACE_JSON(response.responseJSON);
						Ti.API.info("unwrapWithRootNode() parsed data:");
						TRACE_JSON(resp);
					}
					// 성공한경우 sql에 반영
					if (useSQL) {
						saveToSQL(resp);
						var data = readSQL(); // sql과 merge된 데이터를 다시 로드함
						if (DEBUG) {
							Ti.API.info("merged data is:");
							TRACE_JSON(data);
						}
						_.isFunction(params.success) && params.success(data);
					} else {
						_.isFunction(params.success) && params.success(resp);
					}
					model.trigger("fetch");
					model.trigger("complete", { method: method });
				}
				else {
					Ti.API.error("request failed: " + response.code);
					if (DEBUG) {
						Ti.API.info(response.responseText);
					}
					_.isFunction(params.error) && params.error(response);
					model.trigger("complete", { method: method, error: true });
				}
			});
			break;
			
		case 'create':
			params.path = makeResourcePath(urlRoot, model.params, model.attributes);
			params.data = wrapWithNodeName(model.toJSON()); // create때는 모든 속성을 저장해야함
			
			Ti.API.info("[POST]  " + params.path);
			if (DEBUG) {
				Ti.API.info(JSON.stringify(params.data));
			}
			
			// api 저장
			API(params, function(response) {
				if (response.success) {
					var resp = unwrapWithRootNode(response.responseJSON);
					if (DEBUG) {
						Ti.API.info("API() response:");
						TRACE_JSON(response.responseJSON);
						Ti.API.info("unwrapWithRootNode() parsed data:");
						TRACE_JSON(resp);
					}
					
					// 성공한경우 sql에 반영
					if (useSQL) {
						saveToSQL(resp);
						var data = readSQL(); // sql과 merge된 데이터를 다시 로드함
						if (DEBUG) {
							Ti.API.info("merged data is:");
							TRACE_JSON(data);
						}
						_.isFunction(params.success) && params.success(data);
					} else {
						_.isFunction(params.success) && params.success(resp);
					}
					model.trigger("complete", { method: method });
                }
				else {
					if (response.offline && syncMode == "active") {// active mode는 일단 sql에 저장하고 나중에 api로 sync한다.
						saveToSQL(model.toJSON());
						var data = readSQL(); // saveToSQL()에서 model.id를 저장해놓고 다시 로딩함
						if (DEBUG) {
							Ti.API.info("network is offline, but model was saved to sql anyway - active syncMode");
							Ti.API.info("merged data is:");
							TRACE_JSON(data);
						}
						_.isFunction(params.success) && params.success(data);
						model.trigger("complete", { method: method });
					}
					else {
						Ti.API.error("request failed: " + response.code);
						if (DEBUG) {
							Ti.API.info(response.responseText);
						}
						_.isFunction(params.error) && params.error(response);
						model.trigger("complete", { method: method, error: true });
					}
                }
			});
			break;
			
		case 'update':
			params.path = makeResourcePath(urlRoot, model.params, model.attributes, model.id);
			params.data = wrapWithNodeName(dirtyAttributes(model));

			Ti.API.info("[PUT]  " + params.path);
			if (DEBUG) {
				Ti.API.info(JSON.stringify(params.data));
			}
			
			// api 저장
			API(params, function(response) {
				if (response.success) {
					var resp = unwrapWithRootNode(response.responseJSON);
					if (DEBUG) {
						Ti.API.info("API() response:");
						TRACE_JSON(response.responseJSON);
						Ti.API.info("unwrapWithRootNode() parsed data:");
						TRACE_JSON(resp);
					}
					
					// 성공한경우 sql에 반영
					if (useSQL) {
						saveToSQL(resp);
						var data = readSQL(); // sql과 merge된 데이터를 다시 로드함
						if (DEBUG) {
							Ti.API.info("merged data is:");
							TRACE_JSON(data);
						}
						_.isFunction(params.success) && params.success(data);
					} else {
						_.isFunction(params.success) && params.success(resp);
					}
					model.trigger("complete", { method: method });
                }
				else {
					if (response.offline && syncMode == "active") {// active mode는 일단 sql에 저장하고 나중에 api로 sync한다.
						saveToSQL(model.toJSON());
						var data = readSQL(); // saveToSQL()에서 model.id를 저장해놓고 다시 로딩함
						if (DEBUG) {
							Ti.API.info("network is offline, but model was saved to sql anyway - active syncMode");
							Ti.API.info("merged data is:");
							TRACE_JSON(data);
						}
						_.isFunction(params.success) && params.success(data);
						model.trigger("complete", { method: method });
					}
					else {
						Ti.API.error("request failed: " + response.code);
						if (DEBUG) {
							Ti.API.info(response.responseText);
						}
						_.isFunction(params.error) && params.error(response);
						model.trigger("complete", { method: method, error: true });
					}
                }
			});
			break;
			
		case 'delete':
			params.path = makeResourcePath(urlRoot, model.params, model.attributes, model.id);
			
			Ti.API.info("[DELETE]  " + params.path);
			
			// api 저장
			API(params, function(response) {
				if (response.success) {
					if (DEBUG) {
						Ti.API.info("API() response:");
					}
					
					// 성공한경우 sql에 반영
					if (useSQL) {
						deleteSQL();
						if (DEBUG) {
							Ti.API.info("deleteSQL() called");
						}
					}
					
					model.id = null;
					_.isFunction(params.success) && params.success(model.toJSON());
					model.trigger("complete", { method: method });
                }
				else {
					if (response.offline && syncMode == "active") {// active mode는 일단 sql에서 삭제하고 나중에 api로 sync한다.
						deleteSQL();
						model.id = null;
						if (DEBUG) {
							Ti.API.info("network is offline, but model was deleted from sql anyway - active syncMode");
							Ti.API.info("deleteSQL() called");
						}
						_.isFunction(params.success) && params.success(model.toJSON());
						model.trigger("complete", { method: method });
					}
					else {
						Ti.API.error("request failed: " + response.code);
						if (DEBUG) {
							Ti.API.info(response.responseText);
						}
						_.isFunction(params.error) && params.error(response);
						model.trigger("complete", { method: method, error: true });
					}
                }
			});
			break;
	}
	
	
	/*	JSON wrapper (support rails jbuilder and controller params)
	 */
	function wrapWithNodeName(d) {
		if (nodeName) {
			var h = {};
			h[nodeName] = _.clone(d);
			return h;
		} else {
			return d;
		}
	}
	
    function unwrapWithRootNode(d) {
		var data = d;
		if (_.isFunction(rootNode)) {
			data = rootNode(data);
		} else if (!_.isUndefined(rootNode)) {
			var nodes = rootNode.split(",");
			for (var i=0; i < nodes.length; i++) {
				if (data && data[nodes[i]]) {
					data = data[nodes[i]];
				} else {
					// 파싱 에러 발생한 경우 원래 response를 그대로 리턴함
					return d;
				}
			}
		}
		return data;
    }
	
	/*	RESTful URL builder
	 */
	function makeResourcePath(basePath, modelParams, attrs, _id) {
		// replace resource_id
		var names = basePath.split("/"), args = [];
		for (var i=0; i < names.length; i++) {
			var name = names[i];
			if (name[0] == ":") {
				var key = name.substr(1, name.length - 1);
				var val = attrs[key];
				if (!val) {
					Ti.API.warn("resource url - found empty value:  " + key + "  " + basePath);
				}
				names[i] = val;
			}
		}
		// url components
		if (_id) {
			names.push(_id);
		}
		if (modelParams) {
			var actionName = modelParams.action || modelParams.action_name;
			if (actionName) {
				names.push(actionName);
			}
			_.each(_.omit(modelParams, actionName), function(v, k) {
				if (!_.isEmpty(k)) { args.push(k + "=" + v); }
			});
		}
		// build
		var s = names.join("/") + ".json";// use .json format
		if (args.length > 0) {
			s = s + "?" + args.join("&");
		}
		return s;
	}

	/*	dirty attributes processing
	 */
	function dirtyAttributes(m) {
		var ca = m.changedAttributes();// 변경된 attributes만 전송
		return ca;
	}

	/*	SQL helpers
	 */
	function saveToSQL(data) {
		if (DEBUG) {
			Ti.API.info("saveToSQL()");
		}
		if (!data) {
			Ti.API.error("saveToSQL: empty data");
			return;
		}
		
		if (!_.isArray(data)) {// model
			if (!_.isUndefined(data["_destroy"])) {//delete item
				return deleteSQL(data[model.config.adapter.idAttribute]);
			} else {
				return createOrUpdateSQL(data);
			}
		} else {// collection
			// 쿼리 결과를 row by row 모드로 merge
			//   conflict 무시. 일단 발생 상황 자체를 회피해야함
			//   데이터의 수정/삭제는 서버와 반드시 동기화 모드로만 가능
			//   데이터의 추가는 비동기 가능함
			//
			// merge 알고리즘
			// - api와 sql 양쪽에 존재하는 경우:  서버데이터로 갱신 -> update(...)
			// - api에만 존재:  새로 생성된 데이터 -> create(...)
			// - sql에만 존재:  삭제된 데이터 -> delete(...)
			//
			// TODO: conflict 해소 알고리즘 구현
			//       https://tripvi.atlassian.net/browse/TC-10
			//
			var currentModels = sqlCurrentModels();
			var apiModels = [];
			for (var i in data) {
				if (!_.isUndefined(data[i]["_destroy"])) {//delete item
					deleteSQL(data[i][model.config.adapter.idAttribute]);
				} else {
					createOrUpdateSQL(data[i]);
				}
				apiModels.push(data[i][model.config.adapter.idAttribute]);
			}
			var removeModels = _.difference(currentModels, apiModels);
			if (DEBUG) {
				Ti.API.info("saveToSQL() merge mode:  existing model ids " + currentModels);
				Ti.API.info("                         fetched model ids  " + apiModels);
				Ti.API.info("                         to be deleted ids  " + removeModels);
			}
			_.each(removeModels, function(_id) { deleteSQL(_id) });
			
			// RESTful 서버에서 create, update 등의 action에 대해 array response를 보내면 collection으로 인식해서 merge mode가 동작하게된다.
			// 기존의 코드와 호환성이 없으므로 주의할것
		}
	}
	
	function createOrUpdateSQL(data) {
		if (DEBUG) {
			Ti.API.info("createOrUpdateSQL()");
		}
		var attrObj = {};
		if (!data.id) {// id가 없는경우
			// alloy default id인 경우 random id를 새로 만든다. 아니면 AUTOINCREMENT 되도록 내버려둠
			data.id = (model.config.adapter.idAttribute === ALLOY_ID_DEFAULT) ? guid() : null;
			attrObj[model.config.adapter.idAttribute] = data.id;
			// singular model인 경우에만
			if (!_.isNumber(model.length)) {
				model.set(attrObj, { silent: true });
			}
		}

		// assemble columns and values
		var names = [], values = [], q = [];
		for (var k in columns) {
			names.push(k);
			if (_.isObject(data[k])) {
				values.push(JSON.stringify(data[k]));
			} else {
				values.push(data[k]);
			}
			q.push('?');
		}

		// execute the query
		sql = "REPLACE INTO " + table + " (" + names.join(",") + ") VALUES (" + q.join(",") + ");";
		db = Ti.Database.open(dbName);
		db.execute('BEGIN;');
		db.execute(sql, values);
		
		if (DEBUG) {
			Ti.API.info("  QUERY:  " + sql);
			Ti.API.info("  PARAMS: " + values);
		}
		
		// if model.id is still null, grab the last inserted id
		if (data.id === null && !_.isNumber(model.length)) {// singular model인 경우에만
			var sqlId = "SELECT last_insert_rowid();";
			var rs = db.execute(sqlId);
			if (rs && rs.isValidRow()) {
				data.id = rs.field(0);
				attrObj[model.config.adapter.idAttribute] = data.id;
				model.set(attrObj, { silent: true });
			} else {
				Ti.API.warn('Unable to get ID from database for model: ' + model.toJSON());
			}
			if (rs) { rs.close(); }
		}

		// cleanup
		db.execute('COMMIT;');
		db.close();

		return _.isNumber(model.length) ? undefined : model.toJSON();
	}
	
	function readSQL() {
		if (DEBUG) {
			Ti.API.info("readSQL()");
		}
		if (opts.query && opts.id) {
			Ti.API.warn('Both "query" and "id" options were specified for model.fetch(). "id" will be ignored.');
		}
		
		sql = 'SELECT * FROM ' + table;
		if (opts.query) {
			sql = opts.query;
		} else if (model.id || opts.id) {// model 1개만 가져오는 경우
			sql += ' WHERE ' + model.config.adapter.idAttribute + ' = ' + (model.id || opts.id);
		}

		// execute the select query
		db = Ti.Database.open(dbName);
		var rs;

		// is it a string or a prepared statement?
		if (_.isString(sql)) {
			rs = db.execute(sql);
			if (DEBUG) {
				Ti.API.info("  QUERY:  " + sql);
			}
		} else {
			rs = db.execute(sql.statement, sql.params);
			if (DEBUG) {
				Ti.API.info("  sql is defined as object");
				Ti.API.info("  QUERY:  " + sql.statement);
				Ti.API.info("  PARAMS: " + sql.params);
			}
		}
		var len = 0;
		var values = [];

		// iterate through all queried rows
		while (rs.isValidRow()) {
			var o = {};
			var fc = 0;
			// TODO: https://jira.appcelerator.org/browse/ALOY-459
			fc = _.isFunction(rs.fieldCount) ? rs.fieldCount() : rs.fieldCount;
			// create list of rows returned from query
			_.times(fc, function(c) {
				var fn = rs.fieldName(c);
				o[fn] = rs.fieldByName(fn);
			});
			values.push(o);
			len++;
			rs.next();
		}
				
		// close off db after read query
		rs.close();
		db.close();
		
		// shape response based on whether it's a model or collection
		return _.isUndefined(model.length) ? _.last(values) : values; // create시에 read할 경우 values의 마지막 요소가 create된 요소임 @vagrantinoz
	}
	
	function deleteSQL(_id) {
		if (DEBUG) {
			Ti.API.info("deleteSQL()");
		}
		sql = 'DELETE FROM ' + table + ' WHERE ' + model.config.adapter.idAttribute + '=?';

		// execute the delete
		db = Ti.Database.open(dbName);
		db.execute(sql, _id || model.id || opts.id);
		if (DEBUG) {
			Ti.API.info("  QUERY:  " + sql);
			Ti.API.info("  PARAMS: " + _id || model.id || opts.id);
		}
		db.close();
	}
	
	// function sqlFindItem(_id) {
	// 	var sql = 'SELECT ' + model.idAttribute + ' FROM ' + table + ' WHERE ' + model.idAttribute + '=?';
	// 	db = Ti.Database.open(dbName);
	// 	var rs = db.execute(sql, _id);
	// 	var output = [];
	// 	while (rs.isValidRow()) {
	// 		output.push(rs.fieldByName(model.idAttribute));
	// 		rs.next();
	// 	}
	// 	rs.close();
	// 	db.close();
	// 	return output;
	// }
	function sqlCurrentModels() {
		if (DEBUG) {
			Ti.API.info("sqlCurrentModels()");
		}
		// TODO: model.params을 처리하거나 최소한 where 조건절은 입력받아야함
		//
		var sql = 'SELECT ' + model.config.adapter.idAttribute + ' FROM ' + table;
		
		db = Ti.Database.open(dbName);
		var rs = db.execute(sql);
		if (DEBUG) {
			Ti.API.info("  QUERY:  " + sql);
		}
		var output = [];
		while (rs.isValidRow()) {
			output.push(rs.fieldByName(model.config.adapter.idAttribute));
			rs.next();
		}
		rs.close();
		db.close();
		return output;
	}
	
}

function TRACE_JSON(data, printIndex) {
	if (_.isArray(data)) {
		for (var i in data) {
			if (printIndex) Ti.API.info("  " + i + ":");
			Ti.API.info("  " + JSON.stringify(data[i]));
		}
	} else {
		Ti.API.info("  " + JSON.stringify(data));
	}
}



// SOURCE: https://github.com/appcelerator/alloy/blob/master/Alloy/lib/alloy/sync/sql.js
// 변경사항 추적해야함 - sep 18, 2013

function GetMigrationFor(dbname, table) {
	var mid = null;
	var db = Ti.Database.open(dbname);
	db.execute('CREATE TABLE IF NOT EXISTS migrations (latest TEXT, model TEXT);');
	var rs = db.execute('SELECT latest FROM migrations where model = ?;', table);
	if (rs.isValidRow()) {
		mid = rs.field(0) + '';
	}
	rs.close();
	db.close();
	return mid;
}

function Migrate(Model) {
	// get list of migrations for this model
	var migrations = Model.migrations || [];

	// get a reference to the last migration
	var lastMigration = {};
	if (migrations.length) { migrations[migrations.length-1](lastMigration); }

	// Get config reference
	var config = Model.prototype.config;

	// Get the db name for this model and set up the sql migration obejct
	config.adapter.db_name = config.adapter.db_name || ALLOY_DB_DEFAULT;
	var migrator = new Migrator(config);

	// Get the migration number from the config, or use the number of
	// the last migration if it's not present. If we still don't have a
	// migration number after that, that means there are none. There's
	// no migrations to perform.
	var targetNumber = typeof config.adapter.migration === 'undefined' || config.adapter.migration === null ? lastMigration.id : config.adapter.migration;
	if (typeof targetNumber === 'undefined' || targetNumber === null) {
		var tmpDb = Ti.Database.open(config.adapter.db_name);
		migrator.db = tmpDb;
		migrator.createTable(config);
		tmpDb.close();
		return;
	}
	targetNumber = targetNumber + ''; // ensure that it's a string

	// Create the migration tracking table if it doesn't already exist.
	// Get the current saved migration number.
	var currentNumber = GetMigrationFor(config.adapter.db_name, config.adapter.collection_name);

	// If the current and requested migrations match, the data structures
	// match and there is no need to run the migrations.
	var direction;
	if (currentNumber === targetNumber) {
		return;
	} else if (currentNumber && currentNumber > targetNumber) {
		direction = 0; // rollback
		migrations.reverse();
	} else {
		direction = 1;  // upgrade
	}

	// open db for our migration transaction
	db = Ti.Database.open(config.adapter.db_name);
	migrator.db = db;
	db.execute('BEGIN;');

	// iterate through all migrations based on the current and requested state,
	// applying all appropriate migrations, in order, to the database.
	if (migrations.length) {
		for (var i = 0; i < migrations.length; i++) {
			// create the migration context
			var migration = migrations[i];
			var context = {};
			migration(context);

			// if upgrading, skip migrations higher than the target
			// if rolling back, skip migrations lower than the target
			if (direction) {
				if (context.id > targetNumber) { break; }
				if (context.id <= currentNumber) { continue; }
			} else {
				if (context.id <= targetNumber) { break; }
				if (context.id > currentNumber) { continue; }
			}

			// execute the appropriate migration function
			var funcName = direction ? 'up' : 'down';
			if (_.isFunction(context[funcName])) {
				context[funcName](migrator);
			}
		}
	} else {
		migrator.createTable(config);
	}

	// update the saved migration in the db
	db.execute('DELETE FROM migrations where model = ?', config.adapter.collection_name);
	db.execute('INSERT INTO migrations VALUES (?,?)', targetNumber, config.adapter.collection_name);

	// end the migration transaction
	db.execute('COMMIT;');
	db.close();
	migrator.db = null;
}

function installDatabase(config) {
	// get the database name from the db file path
	var dbFile = config.adapter.db_file;
	var table = config.adapter.collection_name;
	var rx = /(^|.*\/)([^\/]+)\.[^\/]+$/;
	var match = dbFile.match(rx);
	if (match === null) {
		throw 'Invalid sql database filename "' + dbFile + '"';
	}
	//var isAbsolute = match[1] ? true : false;
	config.adapter.db_name = config.adapter.db_name || match[2];
	var dbName = config.adapter.db_name;

	// install and open the preloaded db
	Ti.API.debug('Installing sql database "' + dbFile + '" with name "' + dbName + '"');
	var db = Ti.Database.install(dbFile, dbName);

	// set remoteBackup status for iOS
	if (config.adapter.remoteBackup === false && OS_IOS) {
		Ti.API.debug('iCloud "do not backup" flag set for database "'+ dbFile + '"');
		db.file.setRemoteBackup(false);
	}

	// compose config.columns from table definition in database
	var rs = db.execute('pragma table_info("' + table + '");');
	var columns = {};
	while (rs.isValidRow()) {
		var cName = rs.fieldByName('name');
		var cType = rs.fieldByName('type');
		columns[cName] = cType;

		// see if it already has the ALLOY_ID_DEFAULT
		if (cName === ALLOY_ID_DEFAULT && !config.adapter.idAttribute) {
			config.adapter.idAttribute = ALLOY_ID_DEFAULT;
		}

		rs.next();
	}
	config.columns = columns;
	rs.close();

	// make sure we have a unique id field
	if (config.adapter.idAttribute) {
		if (!_.contains(_.keys(config.columns), config.adapter.idAttribute)) {
			throw 'config.adapter.idAttribute "' + config.adapter.idAttribute + '" not found in list of columns for table "' + table + '"\n' + 'columns: [' + _.keys(config.columns).join(',') + ']';
		}
	} else {
		Ti.API.info('No config.adapter.idAttribute specified for table "' + table + '"');
		Ti.API.info('Adding "' + ALLOY_ID_DEFAULT + '" to uniquely identify rows');

		var fullStrings = [],
		colStrings = [];
		_.each(config.columns, function(type, name) {
			colStrings.push(name);
			fullStrings.push(name + ' ' + type);
		});
		var colsString = colStrings.join(',');
		db.execute('ALTER TABLE ' + table + ' RENAME TO ' + table + '_temp;');
		db.execute('CREATE TABLE ' + table + '(' + fullStrings.join(',') + ',' + ALLOY_ID_DEFAULT + ' TEXT UNIQUE);');
		db.execute('INSERT INTO ' + table + '(' + colsString + ',' + ALLOY_ID_DEFAULT + ') SELECT ' + colsString + ',CAST(_ROWID_ AS TEXT) FROM ' + table + '_temp;');
		db.execute('DROP TABLE ' + table + '_temp;');
		
		config.columns[ALLOY_ID_DEFAULT] = 'TEXT UNIQUE';
		config.adapter.idAttribute = ALLOY_ID_DEFAULT;
	}

	// close the db handle
	db.close();
}

module.exports.beforeModelCreate = function(config, name) {
	// use cached config if it exists
	if (cache.config[name]) {
		return cache.config[name];
	}

	// check platform compatibility
	if (Ti.Platform.osname === 'mobileweb' || typeof Ti.Database === 'undefined') {
		throw 'No support for Titanium.Database in MobileWeb environment.';
	}

	// install database file, if specified
	if (config.adapter.db_file) { installDatabase(config); }
	if (!config.adapter.idAttribute) {
		Ti.API.info('No config.adapter.idAttribute specified for table "' + config.adapter.collection_name + '"');
		Ti.API.info('Adding "' + ALLOY_ID_DEFAULT + '" to uniquely identify rows');
		config.columns[ALLOY_ID_DEFAULT] = 'TEXT UNIQUE';
		config.adapter.idAttribute = ALLOY_ID_DEFAULT;
	}

	// add this config to the cache
	cache.config[name] = config;

	return config;
};

module.exports.afterModelCreate = function(Model, name) {
	// use cached Model class if it exists
	if (cache.Model[name]) {
		return cache.Model[name];
	}

	// create and migrate the Model class
	Model = Model || {};
	Model.prototype.idAttribute = Model.prototype.config.adapter.idAttribute;
	Migrate(Model);

	// Add the Model class to the cache
	cache.Model[name] = Model;

	return Model;
};

module.exports.sync = Sync;
