define([
  'jquery'
  ,'underscore'
  ,'socket.io'
  ,'vent'
], function($, _, io, vent){

  var App = null, socket = null;

  var ventList = [
    'pokemon:change'
    ,'party:move'
  ];

  // Bubble all socket.io events to *vent*
  var initEvents = function(){
    _.each(ventList, function(eventName){
      socket.on(eventName, function(data){
        vent.trigger('io:' + eventName, data);
      });
    });
  };

  var start = function(){
    App = require('app');

    try {
      socket = io.connect('http://' + location.host, {
        transports: ['websocket']
      });

      $(document).ajaxSend(function(e, xhr){
        xhr.setRequestHeader('X-Socket-ID', socket.socket.sessionid);
      });

      initEvents();
    } catch(e){
      console.log(e);
    }
  };

  return {
    start: start
  }
});