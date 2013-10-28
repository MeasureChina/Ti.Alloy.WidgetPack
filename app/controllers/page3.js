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
	value: "b",
});

$.input2.init({
	items: [
		["Male", "male"], 
		["Female", "female"], 
		["Both", "both"]
	],
	value: "male",
	pickerStyle: {
		top: 47,
		left: 60,
		width: 140,
	},
});
