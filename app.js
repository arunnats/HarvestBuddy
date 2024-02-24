const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./public/mongo/user");
const path = require("path");
const bcrypt = require("bcrypt");

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

app.get("/content", (req, res) => {
	if (req.isAuthenticated()) {
		res.render("content");
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
	const { name, email, password, confirmPassword } = req.body;

	// Check if passwords match
	if (password !== confirmPassword) {
		console.error("Passwords don't match");
		return res.redirect("/signup"); // Passwords don't match, handle this as needed
	}

	try {
		// Check if the email is already registered
		const existingUser = await User.findOne({ email: email });
		if (existingUser) {
			console.error("User with this email already exists");
			return res.redirect("/signup"); // User already exists, handle this as needed
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = new User({
			name: name,
			email: email,
			password: hashedPassword,
		});

		await newUser.save();
		console.log("User registered successfully");
		res.redirect("/login");
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

app.get("/test", (req, res) => {
	res.render("locationSelection");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
