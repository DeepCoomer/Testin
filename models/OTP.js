import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true
    },
    oid: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600,
    }
});

const OTP = new mongoose.model('otp', OTPSchema);

export default OTP;