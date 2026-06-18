//routes/request/js
const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');

router.get('/user-info', requestController.getUserInfoForRequest);


router.post('/request', requestController.createRequest);


router.get('/my-requests', requestController.getMyRequests);




router.get('/requests', requestController.getAllRequests);


router.get('/request/:category/:id', requestController.getRequestDetails);


router.put('/request/:category/:id', requestController.updateRequestStatus);

module.exports = router;
