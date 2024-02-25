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

// Function to update inventory based on crop growth
userSchema.methods.updateInventory = function () {
	this.cropsGrown.forEach((crop) => {
		crop.resourceUsage.forEach((resource) => {
			const daysPassed = Math.floor(
				(Date.now() - crop.startDate) / (1000 * 60 * 60 * 24)
			);

			if (daysPassed % resource.frequency === 0 && daysPassed > 0) {
				const quantityToSubtract = resource.amountUsed;

				// Update the inventory by subtracting the specified amount
				this.inventory[resource.itemName].forEach((item) => {
					if (item.quantity >= quantityToSubtract) {
						item.quantity -= quantityToSubtract;
					} else {
						// Handle the case where the quantity is not enough
						console.error(
							`Insufficient quantity of ${resource.itemName} in inventory.`
						);
					}
				});
			}
		});
	});
};

module.exports = mongoose.model("User", userSchema);
