const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./public/mongo/user");
const path = require("path");
const bcrypt = require("bcrypt");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(
	"mongodb+srv://login:DouglasAdams42@cluster0.bpavk21.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
);

passport.use(
	new LocalStrategy(
		{ usernameField: "email" },
		async (email, password, done) => {
			try {
				const user = await User.findOne({ email: email });

				if (!user) {
					return done(null, false, { message: "Incorrect email." });
				}

				const isMatch = await bcrypt.compare(password, user.password);

				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, { message: "Incorrect password." });
				}
			} catch (err) {
				return done(err);
			}
		}
	)
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
	try {
		const user = await User.findById(id);
		done(null, user);
	} catch (err) {
		done(err);
	}
});

app.use(
	session({ secret: "your-secret-key", resave: true, saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

function isAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		res.redirect("/login");
	}
}

const updateCropInformation = async () => {
	try {
		console.log("Start Updation process");
		const users = await User.find({ "cropsGrown.0": { $exists: true } }); // Find users with non-empty cropsGrown

		users.forEach(async (user) => {
			user.cropsGrown.forEach((crop) => {
				// Calculate daysPassed and daysLeft
				const currentDate = new Date();
				const startDate = new Date(crop.startDate);
				const endDate = new Date(crop.endDate);

				crop.daysPassed = Math.floor(
					(currentDate - startDate) / (24 * 60 * 60 * 1000)
				);
				crop.daysLeft = Math.floor(
					(endDate - currentDate) / (24 * 60 * 60 * 1000)
				);

				// Update resourceOverview for each resource in crop
				crop.resourceOverview = crop.resourceUsage.map((resource) => {
					const { itemName, amountUsed, frequency } = resource;
					const amountUsedNow = (crop.daysPassed % frequency) * amountUsed;

					return {
						itemName,
						itemsUsed: amountUsedNow,
						totalItemsNeeded: amountUsed * frequency,
					};
				});
			});

			// Save the updated user to the database
			await user.save();
		});

		console.log("Crop information updated successfully for all users.");
	} catch (error) {
		console.error("Error updating crop information:", error);
	}
};

updateCropInformation();
const updateInterval = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
setInterval(updateCropInformation, updateInterval);

app.get("/", (req, res) => {
	if (req.isAuthenticated()) {
		res.redirect("/content");
	} else {
		res.render("landing");
	}
});

app.get("/logout", (req, res) => {
	req.logout();
	res.redirect("/");
});

app.get("/content", async (req, res) => {
	if (req.isAuthenticated()) {
		const { farm, name } = req.user;

		if (farm && farm.latitude && farm.longitude) {
			const { latitude, longitude, name: farmName } = farm;

			try {
				const apiResponse = await axios.get(
					`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&daily=sunrise,sunset,uv_index_max&timezone=auto&past_days=1&forecast_days=1`
				);

				const apiData = apiResponse.data;

				// Extracting current details from the API response
				const currentDetails = apiData.current;

				res.render("content", {
					name,
					farmName,
					location: `${latitude}, ${longitude}`,
					time: currentDetails.time,
					elevation: apiData.elevation,
					humidity: currentDetails.relative_humidity_2m,
					rain: currentDetails.rain,
					windSpeed: currentDetails.wind_speed_10m,
					uvIndexMax: apiData.daily.uv_index_max[1],
					cropsGrown: req.user.cropsGrown,
				});

				console.log(apiData);
			} catch (error) {
				console.error("Error fetching data from the API:", error);
				res.redirect("/");
			}
		} else {
			console.error("User's farm details are missing");
			res.redirect("/");
		}
	} else {
		res.redirect("/");
	}
});

app.get("/login", (req, res) => {
	if (req.isAuthenticated()) {
		res.redirect("/content");
	} else {
		res.render("login");
	}
});

app.get("/signup", (req, res) => {
	if (req.isAuthenticated()) {
		res.redirect("/content");
	} else {
		res.render("signup");
	}
});

app.post("/signup", async (req, res) => {
	const {
		name,
		email,
		password,
		confirmPassword,
		latitude,
		longitude,
		locationName,
	} = req.body;

	if (password !== confirmPassword) {
		console.error("Passwords don't match");
		return res.redirect("/signup");
	}

	try {
		const existingUser = await User.findOne({ email: email });
		if (existingUser) {
			console.error("User with this email already exists");
			return res.redirect("/signup");
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = new User({
			name: name,
			email: email,
			password: hashedPassword,
			farm: {
				name: locationName,
				latitude: parseFloat(latitude),
				longitude: parseFloat(longitude),
			},
		});

		await newUser.save();
		console.log("User registered successfully");

		res.redirect("/content");
	} catch (error) {
		console.error("Error during signup:", error);
		res.redirect("/signup");
	}
});

app.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/content",
		failureRedirect: "/login",
		failureFlash: true,
	})
);

app.get("/inventory", isAuthenticated, (req, res) => {
	const user = req.user;

	res.render("inventory", { user });
});

app.post("/inventory", async (req, res) => {
	const {
		category,
		operation,
		newItemName,
		initialQuantity,
		existingItemName,
		modifyQuantity,
	} = req.body;

	const userEmail = req.user.email;

	try {
		const user = await User.findOne({ email: userEmail });

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Helper function to find an item by name in the specified category
		const findItemByName = (itemName) => {
			return user.inventory[category].find((item) => item.name === itemName);
		};

		// Helper function to create a new item
		const createNewItem = () => {
			const newItem = {
				name: newItemName,
				quantity: parseInt(initialQuantity) || 0,
			};
			user.inventory[category].push(newItem);
			return newItem;
		};

		// Helper function to update the quantity of an existing item
		const updateItemQuantity = (item, quantityChange) => {
			item.quantity = Math.max(0, item.quantity + quantityChange);

			// If the quantity becomes 0, remove the item from the array
			if (item.quantity === 0) {
				const index = user.inventory[category].indexOf(item);
				if (index !== -1) {
					user.inventory[category].splice(index, 1);
				}
			}
		};

		// Logic based on the operation
		if (operation === "new") {
			// Check if an item with the same name already exists
			const existingItem = findItemByName(newItemName);
			if (existingItem) {
				return res
					.status(400)
					.json({ error: "Item with the same name already exists." });
			} else {
				// Create a new item
				const newItem = createNewItem();
				await user.save(); // Save the updated user to the database
				return res.json({ message: "New item created successfully.", newItem });
			}
		} else if (operation === "add" || operation === "subtract") {
			// Check if an existing item is provided
			if (!existingItemName) {
				return res.status(400).json({
					error: "Existing item name is required for add/subtract operation.",
				});
			} else {
				// Find the existing item
				const existingItem = findItemByName(existingItemName);
				if (!existingItem) {
					return res.status(404).json({ error: "Existing item not found." });
				} else {
					// Perform add/subtract operation
					const quantityChange = parseInt(modifyQuantity) || 0;
					if (operation === "add") {
						updateItemQuantity(existingItem, quantityChange);
						await user.save(); // Save the updated user to the database
						return res.json({
							message: "Quantity added successfully.",
							updatedItem: existingItem,
						});
					} else {
						// Subtract operation
						updateItemQuantity(existingItem, -quantityChange);
						await user.save(); // Save the updated user to the database
						return res.json({
							message: "Quantity subtracted successfully.",
							updatedItem: existingItem,
						});
					}
				}
			}
		} else {
			return res.status(400).json({ error: "Invalid operation specified." });
		}
	} catch (error) {
		console.error("Error processing /inventory POST request:", error);
		return res.status(500).json({ error: "Internal server error." });
	}
});

app.get("/api/items", async (req, res) => {
	try {
		const category = req.query.category;

		// Check for required category parameter
		if (!category) {
			res.status(400).json({ error: "Category parameter is required." });
			return;
		}

		// Retrieve all user data (assuming a small number of users)
		const users = await User.find();

		// Extract item names from the specified category across all users
		const itemNames = users
			.flatMap((user) => user.inventory[category])
			.map((item) => item.name);

		res.json({ itemNames });
	} catch (error) {
		console.error("Error fetching item names:", error);
		res.status(500).json({ error: "Internal server error." });
	}
});

app.get("/api/seeds", async (req, res) => {
	try {
		// Retrieve all user data (assuming a small number of users)
		const users = await User.find();

		// Extract seed names from the "seeds" category across all users
		const seedNames = users
			.flatMap((user) => user.inventory.seeds)
			.map((seed) => seed.name);

		res.json({ seedNames });
	} catch (error) {
		console.error("Error fetching seed names:", error);
		res.status(500).json({ error: "Internal server error." });
	}
});

app.get("/api/inventory/categories", async (req, res) => {
	try {
		const users = await User.find();

		// Extract unique categories from all users
		const categoriesSet = new Set();

		users.forEach((user) => {
			const inventory = user.inventory || {};

			Object.keys(inventory).forEach((category) => {
				// Exclude 'seeds' category
				if (category !== "seeds") {
					categoriesSet.add(category);
				}
			});
		});
		console.log(categoriesSet);
		const categories = Array.from(categoriesSet);
		console.log(categories);
		res.json({ categories });
	} catch (error) {
		console.error("Error fetching inventory categories:", error);
		res.status(500).json({ error: "Internal server error." });
	}
});

app.get("/grow-crop", isAuthenticated, (req, res) => {
	const user = req.user;

	res.render("growCrop", { user });
});

app.post("/grow-crop", isAuthenticated, async (req, res) => {
	try {
		const { cropName, estimatedTimeOfGrowth, resourceUsageData } = req.body;
		console.log("resourceUsageData:", resourceUsageData);
		const startDate = new Date().toISOString();

		const endDate = new Date();
		endDate.setDate(endDate.getDate() + parseInt(estimatedTimeOfGrowth, 10));
		const endDateISO = endDate.toISOString();

		console.log("Collected Crop Data:", {
			cropName,
			startDate,
			endDate: endDateISO,
			estimatedTimeOfGrowth,
			resourceUsage: resourceUsageData,
		});

		req.user.cropsGrown.push({
			cropName,
			startDate,
			endDate: endDateISO,
			estimatedTimeOfGrowth,
			resourceUsage: resourceUsageData,
		});

		await req.user.save();

		res.json({ message: "Crop grown successfully." });
	} catch (error) {
		console.error("Error processing /grow-crop POST request:", error);
		res.status(500).json({ error: "Internal server error." });
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
