$.win._options = {
	menu: [
		{
			title: "Search",
			icon: "/appicon.png",
			type: "searchview",
			callback: addItem,
		},
	],
};


$.win.addEventListener("open", function() {
	
});

function addItem(e) {
	var random = Math.ceil(Math.random() * 25);
	var model = Alloy.createModel('user', {
		name: 'new user: ' + random,
		modified_at: new Date(),
	});

	Alloy.Collections.user.add(model);
	
	model.stub = { id: random }; // for server-less test
	
	model.save();
}

function removeItem(e) {
	if (_.isNumber(e.index)) {
		var model = Alloy.Collections.user.at(e.index);
		Alloy.Collections.user.remove(model);
		
		model.destroy();
	}
}

function updateItem(e) {
	if (_.isNumber(e.index)) {
		var random = Math.ceil(Math.random() * 25);
		var model = Alloy.Collections.user.at(e.index);
		model.set({ name: 'old user: ' + random });
		
		model.save();
	}
}
