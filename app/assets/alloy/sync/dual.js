var _ = require('alloy/underscore')._;
var Alloy = require('alloy');

var ALLOY_DB_DEFAULT = '_alloy_';
var ALLOY_ID_DEFAULT = 'alloy_id';

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
//
// callback	success
//			code
//			data
//			responseText
//			responseJSON
//			offline
//
function API(options, callback) {
	if (Ti.Network.online) {
		var xhr = Ti.Network.createHTTPClient({
			timeout : options.timeout || 7000
		});

		// rest api host
		var url = Alloy.Globals.host + options.path;

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
		// custom
		for (var header in options.headers) {
			xhr.setRequestHeader(header, options.headers[header]);
		}
		
		xhr.send(options.data || null);
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





