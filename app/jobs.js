var async = require('async');
var schedule = require('node-schedule');
var _ = require('underscore');
var DayCare = require('./models/daycare');
var config = require('../config.json');

var jobs = [];

var checkEgg = function(){
  DayCare.find({breedRate: {$gt: 0}, egg: null})
  .exec(function(err, dayCares){
    if (err) return console.log('CHECK_EGG_ERROR: ' + err.message);
    dayCares = _.filter(dayCares, function(dayCare){
      return _.random(0, 99) < dayCare.breedRate;
    });

    async.eachSeries(dayCares, function(dayCare, next){
      dayCare.breed(next);
    }, function(err){
      if (err) return console.log('CHECK_EGG_ERROR: ' + err.message);
      if (dayCares.length) {
        console.log(dayCares.length + ' eggs appeared.');
      }
    });
  });
};

exports.start = function(env){
  // Check egg birth every hour
  jobs.push(schedule.scheduleJob(env == 'development' ? {second: 0} : {minute: 0}, checkEgg));
};