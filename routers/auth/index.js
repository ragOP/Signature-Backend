const express = require("express");
const router = express.Router();
const Order4 = require("../../models/oderModel4");
const Order4Abd = require("../../models/orderModel4-abd");
const SignatureRagOrder = require("../../models/signatureRagOrder");
const signatureRagAbd = require("../../models/signatureRagAbd");

router.route("/get-stats/record").get(async (req, res) => {
    try {
        const query = {
            createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 1)) }
        };
        const lander4 = await Order4.find(query).select("createdAt");
        const lander4Count = lander4.length;
        const lander5 = await SignatureRagOrder.find(query).select("createdAt");
        const lander5Count = lander5.length;
        return res.status(200).json({ message: 'User statistics retrieved successfully', stats: { lander4:{
            count: lander4Count,
            title: "Astra Soul",
            lastOrderTime: lander4.length ? lander4[lander4.length - 1].createdAt : null
        }, lander5: {
            count: lander5Count,
            title: "Astra Soul ABD",
            lastOrderTime: lander5.length ? lander5[lander5.length - 1].createdAt : null
        } } });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving user statistics', error });
    }
});

router.route("/get-stats/abandoned").get(async (req, res) => {
    try {
        const query = {
            createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 1)) }
        };
        const lander4 = await Order4Abd.find(query).select("createdAt");
        const lander4Count = lander4.length;
        const lander5 = await signatureRagAbd.find(query).select("createdAt");
        const lander5Count = lander5.length;
        return res.status(200).json({ message: 'User statistics retrieved successfully', stats: { lander4:{
            count: lander4Count,
            title: "Astra Soul",
            lastOrderTime: lander4.length ? lander4[lander4.length - 1].createdAt : null
        }, lander5: {
            count: lander5Count,
            title: "Astra Soul ABD",
            lastOrderTime: lander5.length ? lander5[lander5.length - 1].createdAt : null
        } } });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving user statistics', error });
    }
});

module.exports = router;