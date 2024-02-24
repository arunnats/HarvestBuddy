const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema({
	name: String,
	quantity: Number,
});

const userSchema = new mongoose.Schema({
	name: String,
	email: String,
	phone: Number,
	password: String,
	farm: {
		name: String,
		latitude: Number,
		longitude: Number,
	},
	inventory: {
		fuel: [inventoryItemSchema],
		seeds: [inventoryItemSchema],
		fertilizer: [inventoryItemSchema],
		pesticide: [inventoryItemSchema],
		tool: [inventoryItemSchema],
	},
});

module.exports = mongoose.model("User", userSchema);
