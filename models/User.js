import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';
// import passportLocalMongoose from 'passport-local-mongoose'

const UserSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Wholeseller', 'Retailer', 'Admin', 'Delivery Agent'],
        default: 'Wholeseller'
    },
    category: {
        type: String,
        enum: ['Medicine', 'Automobile', 'Grocery'],
        default: 'Medicine'
    },
    shop_name: {
        type: String,
        required: true
    },
    mobile_number: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    shop_photo: {
        type: String,
        required: true
    },
    kyc_verified: {
        type: Boolean,
        default: false
    },
    kyc_documents: {
        type: String,
        required: true
    }
})

const User = new mongoose.model('user', UserSchema);

export default User