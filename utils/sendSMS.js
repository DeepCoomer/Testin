import fast2sms from 'fast-two-sms';
import dotenv from 'dotenv';

dotenv.config();

const sendSMS = async (message,phone_number) => {
    console.log(process.env.SMS_API_KEY)
    const response = await fast2sms.sendMessage({ 
        authorization: process.env.SMS_API_KEY, 
        message: message, 
        numbers: [phone_number] })
    console.log(response);
}

export default sendSMS