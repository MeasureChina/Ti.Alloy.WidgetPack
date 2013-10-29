$.win._options = {
	menu: [
		{
			title: "Search",
			icon: "/appicon.png",
			type: "searchview",
		},
		{
			title: "New Item",
			icon: "/appicon.png",
		},
		{
			title: "Edit Item",
			icon: "/appicon.png",
		},
	],
};


$.input1.init({
	items: [
		["value A", "a"], 
		["value B", "b"], 
		["value C", "c"], 
		["value D", "d"], 
		["value E", "e"], 
		["value F", "f"], 
		["value G", "g"]
	],
});

$.input2.init({
	items: [
		["Male", "male"], 
		["Female", "female"], 
		["Both", "both"]
	],
	pickerStyle: {
		top: 48,
		left: 60,
		width: 140,
	},
});

$.input3.init();


var model = {
	category: "f",
	gender: "male",
	body: "body",
};

var form = require("form").builder(model, {
	category: $.input1,
	gender: $.input2,
	body: $.input3,
});

form.updateView();


function onSubmit() {
	var error = form.validate({
		category: { presence: true },
		body: { minLength: 1, maxLength: 12 },
	});
	
	if (error) {
		alert(error[0].join(" "));
	} else {
		alert("Okay :)");
	}
}
