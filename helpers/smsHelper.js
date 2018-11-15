"use strict";
const config = require("../config/main");
const twilio = require('../config/twilio');

const { NotAllowedError } = require("../errors/custom");

module.exports = {

  phoneVerification: function(user) {
    if (config.node_env === "test") return;

    return twilio.messages.create({
      body: `Your Infield ID verification code is ${user.phoneVerificationToken}`,
      to: user.phone,
      from: config.twilio.sender_id
    });
  }

};
