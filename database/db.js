import mongoose from 'mongoose';

const Connection = async (url) => {
    try {
        await mongoose.connect(url, { useUnifiedTopology: true, useNewUrlParser: true });
        console.log("Database Connected Successfully");
    } catch (error) {
        console.log(error);
    }
}

export default Connection;