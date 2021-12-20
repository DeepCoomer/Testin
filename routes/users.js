import express from "express";
import User from "../models/User.js";
import fetchuser from "../middlewares/fetchuser.js";
import passport from "passport";
import passportlocal from 'passport-local';
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import grid from 'gridfs-stream';
import mongoose from 'mongoose';
import upload from "../utils/upload.js";
import ac from '../utils/roles.js';
import querymen from 'querymen';

const router = express.Router()

// Passport Local Strategy

let LocalStrategy = passportlocal.Strategy;

// passport.use(User.createStrategy());

passport.use(new LocalStrategy(
    function (email, password, done) {
        User.findOne({ email: email }, async function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect email.' });
            }
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        });
    }
));

// To use with sessions

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

const JWT_Secret = "Ewepasgsg$oy";

const url = 'http://localhost:8000';

let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
    gfs = grid(conn.db, mongoose.mongo);
    gfs.collection('fs');
});


// Route 1: Register an User 

router.post('/register', async (req, res) => {
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json("User Already Exists");
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt)
        user = await new User({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            password: hashedPassword,
            role: req.body.role,
            category: req.body.category,
            shop_name: req.body.shop_name,
            mobile_number: req.body.mobile_number,
            email: req.body.email,
            address: req.body.address,
            shop_photo: req.body.shop_photo,
            kyc_documents: req.body.kyc_documents
        });
        await user.save();
        res.status(200).json({ user_id: user._id })
    } catch (error) {
        res.status(500).json(error);
    }
})

// Route 2: Login an User

router.post('/login', passport.authenticate('local'), async (req, res) => {
    const data = {
        user: {
            id: req.user.id
        }
    }

    const salt = await bcrypt.genSalt(10);

    const userid = req.user.id;
    const cookiedata = req.cookies['connect.sid'];
    // const timestamp = req.headers['date']
    const timestamp = new Date().toISOString()

    const cookietimestamp = cookiedata + timestamp

    const resfreshData = userid.concat(cookietimestamp);

    const refreshtoken = await bcrypt.hash(resfreshData, salt)

    // const refreshData = req.user._id req.cookies['connect.sid']

    const authtoken = jwt.sign(data, JWT_Secret);
    // console.log(req.user);

    const usser = await User.findById(userid).select("-password")

    res.status(200).json({ user: usser, access_token: authtoken, refresh_token: refreshtoken });

})

// Route 3: Get the User

router.post('/getuser', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password")
        const permission = ac.can(user.role).readOwn('profile');
        if (permission.granted) {
            return res.status(200).json(user)
        } else {
            return res.status(400).json("You do not have the required permissions")
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
})

// Route 4: upload image/pdf

router.post("/file/upload", upload.single('file'), async (req, res) => {
    if (!req.file)
        return res.status(404).json("File not found");

    const imageUrl = `${url}/api/users/auth/file/${req.file.filename}`;

    res.status(200).json(imageUrl);
})

//Route 5: Get image/pdf

router.get("/file/:filename", async (req, res) => {
    try {
        const file = await gfs.files.findOne({ filename: req.params.filename });
        const readStream = gfs.createReadStream(file.filename);
        readStream.pipe(res);
    } catch (error) {
        res.status(500).json(error);
    }
})

// Route 6: Get all Users

router.get('/allusers', fetchuser, querymen.middleware(), async (req, res) => {
    try {
        const userId = req.user.id;
        let query = req.querymen;
        let user = await User.findById(userId).select("-password");
        const permission = ac.can(user.role).readAny('profile');
        if (permission.granted) {
            let users = await User.find(query.query, query.select, query.cursor);
            res.status(200).json(users);
        } else {
            return res.status(400).json("You do not have the required permissions");
        }
    } catch (error) {
        res.status(500).json(error)
    }
})

// Route 7: Update an User

router.put('/:id', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password");
        const permission = ac.can(user.role).updateAny('profile');
        if (permission.granted) {
            await User.findByIdAndUpdate(req.params.id, { $set: req.body });
            res.status(200).json("User has been updated");
        } else {
            if (req.params.id === userId) {
                await User.findByIdAndUpdate(req.params.id, { $set: req.body });
                return res.status(200).json("User has been updated");
            } else {
                return res.status(400).json("You do not have the required permissions");
            }
        }
    } catch (error) {
        res.status(500).json(error)
    }
})

// Route 8: Delete an User

router.delete('/:id', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password");
        const permission = ac.can(user.role).updateAny('profile');
        if (permission.granted) {
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json("User has been deleted");
        } else {
            if (req.params.id === userId) {
                await User.findByIdAndDelete(req.params.id);
                return res.status(200).json("User has been deleted");
            } else {
                return res.status(400).json("You do not have the required permissions");
            }
        }
    } catch (error) {
        res.status(500).json(error)
    }
})

// Route 9: Get User from Id

router.get('/:id', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(req.params.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json(error)
    }
})

// Route 10: Verify Kyc

router.put('/verify/:id', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password");
        const permission = ac.can(user.role).updateAny('profile');

        let updatekyc = await User.findById(req.params.id);

        if (!updatekyc) {
            return res.status(400).json("User does not exist");
        }

        if (permission.granted) {
            updatekyc = await User.findById(req.params.id);
            if (!updatekyc.kyc_verified) {
                await User.findByIdAndUpdate(req.params.id, { $set: { kyc_verified: true } });
                return res.status(200).json("User Kyc has been updated");
            } else {
                await User.findByIdAndUpdate(req.params.id, { $set: { kyc_verified: false } });
                return res.status(200).json("User Kyc has been updated");
            }
        } else {
            return res.status(400).json("You do not have the required permissions");
        }
    } catch (error) {
        res.status(500).json(error);
    }
})

// Route 11: Check whether shop name exists or not

router.get('/:shopname', fetchuser, async (req, res) => {
    try {
        let shopname = await User.findOne({ shop_name: req.params.shopname });

        if (shopname) {
            return res.status(200).json(`${req.params.shopname} exists in our system`)
        } else {
            return res.status(400).json(`${req.params.shopname} does not exists in our system`)
        }
    } catch (error) {
        res.status(500).json(error);
    }
})

// Route 12: Creating User by Admin

router.post('/admin/createuser', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password");
        const permission = ac.can(user.role).createAny('profile');
        if (permission.granted) {
            let user = await User.findOne({ email: req.body.email });
            if (user) {
                return res.status(400).json("User Already Exists");
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt)
            user = await new User({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                password: hashedPassword,
                role: req.body.role,
                category: req.body.category,
                shop_name: req.body.shop_name,
                mobile_number: req.body.mobile_number,
                email: req.body.email,
                address: req.body.address,
                shop_photo: req.body.shop_photo,
                kyc_documents: req.body.kyc_documents
            });
            await user.save();
            return res.status(200).json({ user_id: user._id })
        } else {
            return res.status(400).json("You do not have the required permissions");
        }
    } catch (error) {
        res.status(500).json(error);
    }
})

export default router;