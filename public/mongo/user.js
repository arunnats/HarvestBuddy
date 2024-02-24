const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema({
	name: String,
	quantity: Number,
});

const cropGrownSchema = new mongoose.Schema({
	cropName: String,
	startDate: { type: Date, default: Date.now },
	endDate: {
		type: Date,
		validate: {
			validator: function (value) {
				return value > this.startDate;
			},
			message: "End date must be after start date",
		},
	},
	estimatedTimeOfGrowth: Number,
	resourceUsage: [
		{
			itemName: String,
			amountUsed: Number,
			frequency: Number,
		},
	],
});

const userSchema = new mongoose.Schema({
	name: String,
	email: String,
	phone: Number,
	password: String,
	farm: {
		name: String,
		latitude: { type: Number, min: -90, max: 90 },
		longitude: { type: Number, min: -180, max: 180 },
	},
	inventory: {
		fuel: [inventoryItemSchema],
		seeds: [inventoryItemSchema],
		fertilizer: [inventoryItemSchema],
		pesticide: [inventoryItemSchema],
		tool: [inventoryItemSchema],
	},
	cropsGrown: [cropGrownSchema],
});

module.exports = mongoose.model("User", userSchema);
