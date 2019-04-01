'use strict';
const config = require("../config");
const sms = require("../helpers/smsHelper");
const mailer = require("../helpers/mailerHelper");
const User = require("../models/user");
const Rating = require('../models/rating');
const ObjectId = require('mongoose').Types.ObjectId;

const {
  NoDataError,
  NotFoundError,
  InvalidArgumentError,
  NotAllowedError
} = require("../errors");

// all user functionality
module.exports = {
  // get me
  getMe: function(req, res, next) {
    return res.status(200).send(req.user.filterForClient());
  },

  // edit user
  editMe: function(req, res, next) {
    if (!req.body) return next(new NoDataError());
    let user = req.user;
    const userEdits = req.body;
    if (
      userEdits.emailVerified ||
      userEdits.salt ||
      userEdits.resetPasswordToken ||
      userEdits.resetPasswordExpires ||
      userEdits.emailVerificationToken ||
      userEdits.specialties ||
      userEdits.regions ||
      userEdits.rating
    )
      return next(new InvalidArgumentError("Field cannot be updated"));

    user = Object.assign(user, userEdits);

    return user.save()
      .then(user => res.status(201).send(user.filterForClient()))
      .catch(err => next(err));
  },

  getAvailableSpecialties: function(req, res, next) {
    if (req.user.accountType !== "agronomist")
      throw new NotAllowedError("You must have an agronomist account")

    return res.status(200).send({ specialties: ['corn', 'barley', 'wheat'] });
  },

  getAvailableRegions: function(req, res, next) {
    if (req.user.accountType !== "agronomist")
      throw new NotAllowedError("You must have an agronomist account")

    return res.status(200).send({ regions: ['ON', 'BC', 'QC', "AB", 'NS', 'NB', 'NL', 'PE', 'MB', 'SK', 'AB', 'YT', 'NT', 'NU'] });
  },

  // add regions or specialties for agronomists
  addSkills: function(req, res, next) {
    const { specialties, regions } = req.body;
    const user = req.user;

    user.specialties.addToSet(...specialties);
    user.regions.addToSet(...regions);
    return user.save()
      .then(user => res.status(201).send(user.filterForClient()))
      .catch(err => next(err));
  },

  // remove specialty for agronomists
  removeSpecialty: function(req, res, next) {
    const specialty = req.body.specialty;
    const user = req.user;

    const idx = user.specialties.indexOf(specialty);

    if (idx > -1) user.specialties.splice(idx, 1);
    return user.save()
      .then(user => res.status(201).send(user.filterForClient()))
      .catch(err => next(err));
  },

  // remove region for agronomists
  removeRegion: function(req, res, next) {
    const region = req.body.region;
    const user = req.user;

    const idx = user.regions.indexOf(region);
    if (idx > -1) user.regions.splice(idx, 1);
    return user.save()
      .then(user => res.status(201).send(user.filterForClient()))
      .catch(err => next(err));
  },

  // delete user
  deleteMe: function(req, res, next) {
    return req.user.remove()
      .then(user => res.status(204).send({ success: true }))
      .catch(err => next(err));
  },

  // get user
  getUser: function(req, res, next) {
    const uid = req.params.uid;
    return User.findById(uid)
      .then(user => {
        if (!user) throw new NotFoundError("User not found");

        return res.status(200).send(user.filterForClient());
      })
      .catch(err => next(err));
  },

  // search all users
  searchUsers: function(req, res, next) {
    const name = req.query.name;
    if (!name) throw new NoDataError("No search string provided");

    const names = name.split(" ");
    const numNames = names.length;
    let query = { firstName: { $regex: names[0], $options: "i" } };
    if (numNames > 1)
      query.lastName = { $regex: names[numNames - 1], $options: "i" };

    return User.find(query, "firstName lastName")
      .then(users => res.status(200).send(users))
      .catch(err => next(err));
  }

};
