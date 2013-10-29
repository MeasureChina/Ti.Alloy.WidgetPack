exports.definition = {
	config: {
		columns: {
			"id": "integer PRIMARY KEY AUTOINCREMENT",
		    "name": "text",
			"modified_at": "text",
		},
		adapter: {
			type: "dual",
			collection_name: "user",
			idAttribute: "id",
			syncMode: "transaction",
		},
		debug: true,
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, {
			// extended functions and properties go here
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			// extended functions and properties go here
		});

		return Collection;
	}
};
