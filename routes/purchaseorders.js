import express from 'express';
import OTP from '../models/OTP.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import User from '../models/User.js';
import sendSMS from '../utils/sendSMS.js';
import grid from 'gridfs-stream';
import mongoose from 'mongoose';
import upload from "../utils/upload.js";
import fetchuser from '../middlewares/fetchuser.js';
import checkkyc from '../middlewares/checkyc.js';
import ac from '../utils/roles.js';
import querymen from 'querymen';

const url = 'http://localhost:8000';

let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
    gfs = grid(conn.db, mongoose.mongo);
    gfs.collection('fs');
});


const router = express.Router();

// Route 1: Creating/Placing Order

router.post('/placeorder', fetchuser, checkkyc, async (req, res) => {
    try {
        let Touser = await User.findOne({ shop_name: req.body.to });
        let fromuser = await User.findOne({ shop_name: req.body.from });
        let order = await new PurchaseOrder({
            uid: req.user.id,
            to: Touser._id,
            from: fromuser._id,
            weight: req.body.weight,
            height: req.body.height,
            no_of_parcel: req.body.no_of_parcel,
            delivery_options: req.body.delivery_options,
            payment_method: req.body.payment_method,
            delivery_charges: req.body.delivery_charges,
            order_image: req.body.order_image,
            bill_image: req.body.bill_image
        });
        await order.save();

        res.status(200).json({ status: "Your Order has been placed" })
    } catch (error) {
        res.status(500).json(error)
    }
})

// Route 2 : Approve/ Disapprove an order by admin

// router.put('/approveorder/:id', fetchuser, async (req, res) => {
//     try {
//         const userId = req.user.id;
//         let user = await User.findById(userId).select("-password");
//         const permission = ac.can(user.role).updateAny('order');

//         let order = await PurchaseOrder.findById(req.params.id);

//         if (!order) {
//             return res.status(400).json('Order does not exists');
//         }

//         if (permission.granted) {
//             if (!order.approved) {
//                 await PurchaseOrder.findByIdAndUpdate(req.params.id, { $set: { approved: true } })
//                 return res.status(200).json(`Order with id ${order._id} has been approved`);
//             } else {
//                 await PurchaseOrder.findByIdAndUpdate(req.params.id, { $set: { approved: false } })
//                 return res.status(200).json(`Order with id ${order._id} has been disapproved`);
//             }
//         } else {
//             return res.status(400).json("You do not have the required permissions.");
//         }
//     } catch (error) {
//         res.status(500).json(error)
//     }
// })

// Route 3 : Get all the open orders

router.get('/openorders', fetchuser, querymen.middleware(), async (req, res) => {
    try {
        const userId = req.user.id;
        let query = req.querymen;
        let user = await User.findById(userId).select("-password");
        const permission = ac.can(user.role).readAny('order');
        if (permission.granted) {
            let orders = await PurchaseOrder.find({ delivery_agent: "Not Assigned" }, query.query, query.cursor);
            return res.status(200).json(orders);
        } else {
            return res.status(400).json("You do not have the required permissions");
        }
    } catch (error) {
        res.status(500).json(error);
    }
})

// Route 4: Deliver the order

router.put('/deliverorder/:oid', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password");
        const deliverypermission = ac.can(user.role).updateAny('order');
        let order = await PurchaseOrder.findById(req.params.oid);
        if (!order) {
            return res.status(400).json("Order does not exists");
        }
        // let requestbody = Object.keys(req.body)
        // console.log(requestbody[0])
        if (deliverypermission.granted && deliverypermission.attributes.includes('delivery_agent')) {
            if (order.delivery_agent === 'Not Assigned') {
                await PurchaseOrder.findByIdAndUpdate(req.params.oid, { $set: { delivery_agent: userId } });
                return res.status(200).json("Order has been updated");
            } else {
                return res.status(400).json("Already Assigned a Delivery Agent");
            }
        } else {
            return res.status(400).json("You do not have the required permissions");
        }
    } catch (error) {
        res.status(500).json(error);
    }
})

// Route 5: Generate OTP to start an Order

router.post('/startorder', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password");
        let order = await PurchaseOrder.findById(req.body.oid);

        if (!order) {
            return res.status(400).json("Order does not exists");
        }

        if (user.role === 'Delivery Agent') {
            let otp = await OTP.findOne({ uid: userId, oid: req.body.oid });

            if (!otp && order.order_status === 'OPEN') {
                otp = await new OTP({
                    uid: userId,
                    oid: order._id,
                    otp: (Math.floor(Math.random() * 10000) + 10000).toString().substring(1)
                }).save()
            } else if (otp && order.order_status === 'OPEN') {
                await otp.delete();
                otp = await new OTP({
                    uid: userId,
                    oid: order._id,
                    otp: (Math.floor(Math.random() * 10000) + 10000).toString().substring(1)
                }).save()
            }

            const message = `Your OTP for picking up orderId: ${req.body.oid} is ${otp.otp}`

            let fromuser = await User.findById(order.from)

            await sendSMS(message, fromuser.mobile_number)
            return res.status(200).json(`Your OTP for picking up orderId: ${req.body.oid} is ${otp.otp}`);
        } else {
            return res.status(400).json("You do not have the required permissions");
        }
    } catch (error) {
        res.status(500).json(error)
    }
})

// Route 6: Start an Order after successfully verifying the otp

router.post('/startorder/:oid', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password");
        if (user.role === 'Delivery Agent') {
            let otp = await OTP.findOne({ oid: req.params.oid, otp: req.body.otp });

            if (!otp) {
                return res.status(404).json("OTP invalid or has been expired");
            }

            let order = await PurchaseOrder.findById(req.params.oid);

            order.order_status = 'ONGOING';

            await order.save();
            await otp.delete();

            // Message

            return res.status(200).json({ status: "Your order has been successfully accepted by our delivery agent" })
        } else {
            return res.status(400).json("You do not have the required permissions");
        }
    } catch (error) {
        res.status(500).json(error)
    }
})

// Route 7: Generating OTP for completion of an purchaseorder

router.post('/completeorder', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password");
        let order = await PurchaseOrder.findById(req.body.oid);

        if (!order) {
            return res.status(400).json("Order does not exists");
        }

        if (user.role === 'Delivery Agent') {
            let otp = await OTP.findOne({ uid: userId, oid: req.body.oid });

            if (!otp && order.order_status === 'ONGOING') {
                otp = await new OTP({
                    uid: userId,
                    oid: order._id,
                    otp: (Math.floor(Math.random() * 10000) + 10000).toString().substring(1)
                }).save()
            } else if (otp && order.order_status === 'ONGOING') {
                await otp.delete();
                otp = await new OTP({
                    uid: userId,
                    oid: order._id,
                    otp: (Math.floor(Math.random() * 10000) + 10000).toString().substring(1)
                }).save()
            }

            const message = `Your OTP for delivering orderId: ${req.body.oid} is ${otp.otp}`;

            let touser = await User.findById(order.to);

            await sendSMS(message, touser.mobile_number);

            return res.status(200).json(`Your OTP for delivering orderId: ${req.body.oid} is ${otp.otp}`);
        } else {
            return res.status(400).json("You do not have the required permissions");
        }
    } catch (error) {
        res.status(500).json(error)
    }
})

// Route 8: Completing an order after successfully verifying the OTP

router.post('/completeorder/:oid', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password");

        if (user.role === 'Delivery Agent') {
            let otp = await OTP.findOne({ oid: req.params.oid, otp: req.body.otp });

            if (!otp) {
                return res.status(404).json("OTP invalid or has been expired");
            }

            let order = await PurchaseOrder.findById(req.params.oid);

            order.order_status = 'DELIVERED';

            await order.save();
            await otp.delete();

            // Message

            return res.status(200).json({ status: "Your order has been successfully delivered to you by our delivery agent" })
        } else {
            return res.status(400).json("You do not have the required permissions");
        }
    } catch (error) {
        res.status(500).json(error)
    }
})

// Route 9: Get All Orders

router.get('/orders', fetchuser, querymen.middleware(), async (req, res) => {
    try {
        const userId = req.user.id;
        let query = req.querymen;
        let user = await User.findById(userId).select("-password");
        const permission = ac.can(user.role).readAny('order');
        if (permission.granted) {
            let orders = await PurchaseOrder.find(query.query, query.select, query.cursor);
            return res.status(200).json(orders);
        } else {
            let fromorders = await PurchaseOrder.find({ from: userId }, query.query, query.cursor);
            let toorders = await PurchaseOrder.find({ to: userId }, query.query, query.cursor);
            res.status(200).json(toorders.concat(fromorders));
        }
    } catch (error) {
        res.status(500).json(error);
    }
})

// Route 10: Get a Order

router.get('/getorder/:id', fetchuser, async (req, res) => {
    try {
        let order = await PurchaseOrder.findById(req.params.id);
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json(error);
    }
})

// Route 11: Update a Order

router.put('/updateorder/:id', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password");
        const permission = ac.can(user.role).updateAny('order');

        if (permission.granted) {
            await PurchaseOrder.findByIdAndUpdate(req.params.id, { $set: req.body });
            return res.status(200).json("Order has been Updated");
        } else {
            return res.status(400).json("You do not have the required permissions");
        }
    } catch (error) {
        res.status(500).json(error);
    }
})

// Route 12: Delete an Order

router.delete('/:oid', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password");
        const permission = ac.can(user.role).deleteAny('order');
        let order = await PurchaseOrder.findById(req.params.oid);
        if (!order) {
            return res.status(400).json("Order does not exist");
        }
        if (permission.granted) {
            await PurchaseOrder.findByIdAndDelete(req.params.oid);
            return res.status(200).json("The Order has been deleted");
        } else {
            if (userId === order.uid) {
                if (order.order_status === 'OPEN') {
                    await PurchaseOrder.findByIdAndDelete(req.params.oid);
                    return res.status(200).json("The Order has been deleted");
                } else {
                    return res.status(200).json("You cannot delete this order as it has already been accepted by our delivery agent");
                }
            } else {
                return res.status(200).json("You do not have the required permissions");
            }
        }
    } catch (error) {
        res.status(500).json(error);
    }
})

// Route 13: upload image/pdf

router.post("/file/upload", upload.single('file'), async (req, res) => {
    if (!req.file)
        return res.status(404).json("File not found");

    const imageUrl = `${url}/api/purchaseorders/file/${req.file.filename}`;

    res.status(200).json(imageUrl);
})

//Route 14: Get image/pdf

router.get("/file/:filename", async (req, res) => {
    try {
        const file = await gfs.files.findOne({ filename: req.params.filename });
        const readStream = gfs.createReadStream(file.filename);
        readStream.pipe(res);
    } catch (error) {
        res.status(500).json(error);
    }
})

// Route 15: Get order of the assigned delivery agent

router.get("/deliveryagent/:id", fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        let user = await User.findById(userId).select("-password");
        const permission = ac.can(user.role).readAny('order');
        if (permission.granted && user.role === 'Delivery Agent') {
            let orders = await PurchaseOrder.find({ delivery_agent: req.params.id });
            return res.status(200).json(orders);
        } else {
            return res.status(400).json("You do not have the required permissions");
        }
    } catch (error) {
        res.status(500).json(error);
    }
})

export default router;