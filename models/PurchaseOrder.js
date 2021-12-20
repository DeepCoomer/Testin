import mongoose from 'mongoose';

const PurchaseOrderSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    weight: {
        type: String,
        required: true
    },
    height: {
        type: String,
        required: true
    },
    no_of_parcel: {
        type: String,
        required: true
    },
    delivery_options:{
        type: String,
        enum: ['Express Delivery', 'Normal Delivery'],
        default: 'Normal Delivery'
    },
    payment_method: {
        type: String,
        enum: ['Postpaid', 'Prepaid'],
        default: 'Postpaid'
    },
    delivery_charges:{
        type: String,
        enum: ['Paid by me', 'To pay'],
        default: 'Paid by me'
    },
    order_image: {
        type: String,
        required: true
    },
    bill_image: {
        type: String,
        required: true
    },
    order_status: {
        type: String,
        enum: ['OPEN', 'ONGOING', 'DELIVERED'],
        default: 'OPEN'
    },
    delivery_agent: {
        type: String,
        default: 'Not Assigned'
    }
}, {timestamps: true})

const PurchaseOrder = new mongoose.model('purchaseorder', PurchaseOrderSchema);

export default PurchaseOrder