const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./public/mongo/user");
const path = require("path");
const bcrypt = require("bcrypt");
const axios = require("axios");

const app = express();

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
					uvIndexMax: apiData.daily.uv_index_max[1], // Assuming you want the UV index max for the current day
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
		successRedirect: "/content", // Redirect to the content page if authentication is successful
		failureRedirect: "/login", // Redirect to the login page if authentication fails
		failureFlash: true, // Enable flash messages for failure messages
	})
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
