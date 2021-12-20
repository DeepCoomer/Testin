import { AccessControl } from 'accesscontrol';

let grantArray = [
    { role: 'Wholeseller', resource: 'profile', action: 'read:own', attributes: '*' },
    { role: 'Wholeseller', resource: 'order', action: 'read:own', attributes: '*' },
    { role: 'Wholeseller', resource: 'profile', action: 'update:own', attributes: '*' },
    { role: 'Wholeseller', resource: 'order', action: 'update:own', attributes: 'to,from' },
    { role: 'Wholeseller', resource: 'profile', action: 'delete:own', attributes: '*' },
    { role: 'Retailer', resource: 'profile', action: 'read:own', attributes: '*' },
    { role: 'Retailer', resource: 'order', action: 'read:own', attributes: '*' },
    { role: 'Retailer', resource: 'profile', action: 'update:own', attributes: '*' },
    { role: 'Retailer', resource: 'order', action: 'update:own', attributes: 'to,from' },
    { role: 'Retailer', resource: 'profile', action: 'delete:own', attributes: '*' },
    { role: 'Delivery Agent', resource: 'profile', action: 'read:own', attributes: '*' },
    { role: 'Delivery Agent', resource: 'profile', action: 'update:own', attributes: '*' },
    { role: 'Delivery Agent', resource: 'profile', action: 'delete:own', attributes: '*' },
    { role: 'Delivery Agent', resource: 'order', action: 'update:any', attributes: '!to,!from,!weight,!height,!no_of_parcel,!delivery_options,!payment_method,!delivery_charges,!order_image,!bill_image,!order_status, delivery_agent' },
    { role: 'Delivery Agent', resource: 'order', action: 'read:any', attributes: '*' },
    { role: 'Admin', resource: 'profile', action: 'create:any', attributes: '*' },
    { role: 'Admin', resource: 'profile', action: 'read:any', attributes: '*' },
    { role: 'Admin', resource: 'profile', action: 'update:any', attributes: '*' },
    { role: 'Admin', resource: 'profile', action: 'delete:any', attributes: '*' },
    { role: 'Admin', resource: 'order', action: 'read:any', attributes: '*' },
    { role: 'Admin', resource: 'order', action: 'update:any', attributes: '*' },
    { role: 'Admin', resource: 'order', action: 'delete:any', attributes: '*' },
]

let ac = new AccessControl(grantArray);

export default ac
