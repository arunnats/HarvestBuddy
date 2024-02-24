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
	"mongodb+srv://login:DouglasAdams42@cluster0.bpavk21.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}
);

passport.use(
	new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
		User.findOne({ email: email }, (err, user) => {
			if (err) return done(err);

			if (!user) {
				return done(null, false, { message: "Incorrect email." });
			}

			bcrypt.compare(password, user.password, (err, isMatch) => {
				if (err) return done(err);

				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, { message: "Incorrect password." });
				}
			});
		});
	})
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) =>
	User.findById(id, (err, user) => done(err, user))
);

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

app.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/content",
		failureRedirect: "/login",
		failureFlash: true,
	})
);

app.post("/signup", async (req, res) => {
	const { name, email, password } = req.body;

	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = new User({
			name: name,
			email: email,
			password: hashedPassword,
		});

		await newUser.save();
		res.redirect("/login");
	} catch (error) {
		console.error(error);
		res.redirect("/signup");
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

app.get("/change-password", (req, res) => {
	if (req.isAuthenticated()) {
		res.render("changepassword");
	} else {
		res.redirect("/content");
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
