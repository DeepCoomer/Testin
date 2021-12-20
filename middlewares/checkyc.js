import User from "../models/User.js";

const checkkyc = async (req, res, next) => {
    try {
        let user = await User.findById(req.user.id);
        let to = await User.findOne({shop_name: req.body.to});
        let from = await User.findOne({shop_name: req.body.from});
        if (!user) {
            return res.status(404).json("User Not Found");
        }
        if (!user.kyc_verified) {
            return res.status(400).json("Please Verify Your Kyc");
        }
        if (!to) {
            return res.status(404).json("Not Found");
        }
        if (!from) {
            return res.status(404).json("Not Found");
        }
        if (!to.kyc_verified) {
            return res.status(400).json(`${to.username},Please Verify Your Kyc`);
        }
        if (!from.kyc_verified) {
            return res.status(400).json(`${from.username},Please Verify Your Kyc`);
        }

        next();
    } catch (error) {
        res.status(500).json(error);
    }
}

export default checkkyc