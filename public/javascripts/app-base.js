define([
  'underscore'
  ,'marionette'
], function(_, Marionette){

  var $ = Marionette.$;

  // Extend Marionette.Application for async initialization
  var AppBase = Marionette.Application.extend({
    constructor: function(options){
      Marionette.Application.apply(this, options);
      this._deferredInits = [];
    }

    ,addAsyncInitializer: function(initializer){
      this._deferredInits.push(initializer);
    }

    ,start: function(options){
      var me = this;

      me.triggerMethod("initialize:before", options);
      $.when.apply($, _.map(me._deferredInits, function(initializer){
        return $.Deferred(function(dfd){
          initializer.call(me, dfd, options);
        });
      })).done(function(){
        me._initCallbacks.run(options, me);
        me.triggerMethod("initialize:after", options);
        me.triggerMethod("start", options);
      });
    }
  });

  return AppBase;
});