const mongoose = require("mongoose");
const twilio = require("twilio");
const config = require("../config.json");

// const twilioClient = twilio(config.twilio.apiSid, config.twilio.authToken, config.twilio.authToken);
const twilioClient = twilio(config.twilio.apiSid, config.twilio.authToken, {
	accountSid: config.twilio.accountSid,
});

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
	daysPassed: Number,
	daysLeft: Number,
	resourceUsage: [
		{
			itemName: String,
			amountUsed: Number,
			frequency: Number,
		},
	],
	resourceOverview: [
		{
			itemName: String,
			itemsUsed: Number,
			totalItemsNeeded: Number,
		},
	],
});

const userSchema = new mongoose.Schema({
	name: String,
	email: String,
	phone: String,
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
	finishedCrops: [
		{
			cropName: String,
			amount: Number,
		},
	],
});

// Function to update inventory based on crop growth
userSchema.methods.updateInventory = async function () {
	// Iterate over crops asynchronously
	for (const crop of this.cropsGrown) {
		// Iterate over resourceUsage asynchronously
		for (const resource of crop.resourceUsage) {
			const daysPassed = Math.floor(
				(Date.now() - crop.startDate) / (1000 * 60 * 60 * 24)
			);

			if (daysPassed % resource.frequency === 0 && daysPassed > 0) {
				const quantityToSubtract = resource.amountUsed;

				// Update the inventory by subtracting the specified amount
				for (const item of this.inventory[resource.itemName]) {
					if (item.quantity >= quantityToSubtract) {
						item.quantity -= quantityToSubtract;

						// Send SMS alert
						await twilioClient.messages.create({
							body: `Alert: You used ${quantityToSubtract} units of ${resource.itemName}. You have ${item.quantity} units left for ${crop.cropName}.`,
							to: this.phone,
							from: "+1 386 310 3856",
						});
					} else {
						// Handle the case where the quantity is not enough
						console.error(
							`Insufficient quantity of ${resource.itemName} in inventory for ${crop.cropName}.`
						);

						// Send SMS alert about insufficient quantity
						await twilioClient.messages.create({
							body: `Alert: Insufficient quantity of ${resource.itemName} in inventory for ${crop.cropName}.`,
							to: this.phone,
							from: "+1 386 310 3856", // Replace with your Twilio phone number
						});

						// Check if the next date of usage is within the reminder threshold (e.g., 5 days)
						const nextDateOfUsage =
							crop.startDate.getTime() + (daysPassed + 1) * 24 * 60 * 60 * 1000;
						const reminderThreshold = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds

						if (nextDateOfUsage - Date.now() < reminderThreshold) {
							console.log(
								`Reminder: Add more ${resource.itemName} to inventory for ${crop.cropName}.`
							);
						}
					}
				}
			}
		}
	}
};

// Function to update crop information
userSchema.statics.updateCropInformation = async function () {
	try {
		console.log("Start Updation process");
		const users = await this.find({ "cropsGrown.0": { $exists: true } });

		users.forEach(async (user) => {
			user.cropsGrown.forEach((crop) => {
				const currentDate = new Date();
				const startDate = new Date(crop.startDate);
				const endDate = new Date(crop.endDate);

				crop.daysPassed = Math.floor(
					(currentDate - startDate) / (24 * 60 * 60 * 1000)
				);
				crop.daysLeft = Math.floor(
					(endDate - currentDate) / (24 * 60 * 60 * 1000)
				);

				crop.resourceOverview = crop.resourceUsage.map((resource) => {
					const { itemName, amountUsed, frequency } = resource;
					const amountUsedNow = (crop.daysPassed % frequency) * amountUsed;

					return {
						itemName,
						itemsUsed: amountUsedNow,
						totalItemsNeeded: amountUsed * frequency,
					};
				});

				// If the crop has finished its growth cycle, add it to finishedCrops
				if (crop.daysLeft <= 0) {
					user.finishedCrops.push({
						cropName: crop.cropName,
						amount: 1, // You can modify this based on your requirements
					});
				}
			});

			await user.save();
		});

		console.log("Crop information updated successfully for all users.");
	} catch (error) {
		console.error("Error updating crop information:", error);
	}
};

module.exports = mongoose.model("User", userSchema);
