import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_Secret = "Ewepasgsg$oy";

const fetchuser = (req, res, next) => {
    // Get the user from the jwt token and add id to req object
    const token = req.header('access-token');
    if (!token) {
        return res.status(401).send({ error: "Please authenticate using a valid token" })
    }
    try {
        const data = jwt.verify(token, JWT_Secret);
        req.user = data.user;
        next();
    } catch (error) {
        return res.status(401).send({ error: "Please authenticate using a valid token" })
    }

}

export default fetchuser;