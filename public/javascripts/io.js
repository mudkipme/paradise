define([
  'jquery'
  ,'underscore'
  ,'socket.io'
  ,'vent'
], function($, _, io, vent){

  var App = null, socket = null;

  var ioEvents = {
    'pokemon:change': function(pokemon){
      App.trainer.party.modelSet(pokemon);
      App.trainer.storage.modelSet(pokemon);
    }
    ,'party:move': function(order){
      App.trainer.party.orderChange(order);
    }
    ,'party:add': function(pokemon){
      App.trainer.party.add(pokemon);
    }
    ,'party:remove': function(id){
      var pokemon = App.trainer.party.get(id);
      pokemon && App.trainer.party.remove(pokemon);
    }
    ,'storage:add': function(pokemon){
      if (pokemon.boxId === App.trainer.storage.boxId) {
        delete pokemon.boxId;
        App.trainer.storage.add(pokemon);
      }
    }
    ,'storage:remove': function(pos){
      if (pos.boxId === App.trainer.storage.boxId) {
        var pokemon = App.trainer.storage.findWhere({position: pos.position});
        pokemon && App.trainer.storage.remove(pokemon);
      }
    }
    ,'storage:change': function(boxId, attrs){
      if (boxId == App.trainer.storage.boxId) {
        _.extend(App.trainer.storage, attrs);
        App.trainer.storage.trigger('sync');
      }
    }
    ,'storage:move': function(pokemon, options){
      App.trainer.storage.moveSet(pokemon, options);
    }
    ,'storage:reset': function(){
      App.trainer.set({'currentBox': 0});
      App.trainer.storage.fetch({reset: true});
    }
  };

  var initEvents = function(){
    _.each(ioEvents, function(cb, eventName){
      socket.on(eventName, function(data){
        if (_.isFunction(cb)) {
          cb.apply(socket, arguments);
        }
        // Bubble all socket.io events to *vent*
        var args = _.toArray(arguments);
        args.unshift('io:' + eventName);
        vent.trigger.apply(vent, args);
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