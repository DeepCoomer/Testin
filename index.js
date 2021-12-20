import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import Connection from './database/db.js';
import userRoutes from './routes/users.js';
import purchaseorderRoutes from './routes/purchaseorders.js';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config();

const app = express();

// Database Connection

Connection(process.env.MONGO_URL);

// Session Middlewares

app.use(session({
    secret: 'r8q,+&1LM3)CD*zAGpx1xm{NeQhc;#',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 }
}));

// Middlewares

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

// Routes

app.use('/api/users/auth', userRoutes);
app.use('/api/purchaseorders', purchaseorderRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running at http://localhost:${process.env.PORT}`);
})