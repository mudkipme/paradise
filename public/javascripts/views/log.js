define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'moment'
  ,'models/log'
  ,'views/pokemon'
  ,'text!templates/log.html'
  ,'util'
], function($, _, Marionette, i18n, moment, Log, PokemonView, logTemplate){

  var helpers = PokemonView.prototype.templateHelpers;

  var LogView = Marionette.ItemView.extend({
    className: 'log-view'
    ,tagName: 'li'
    ,model: Log

    ,template: _.template(logTemplate)
    ,templateHelpers: {
      t: i18n.t
      ,moment: moment
      ,spriteUrl: function(pokemon){
        return helpers.spriteUrl.apply({pokemon: pokemon});
      }
      ,pokemonName: function(pokemon){
        return helpers.pokemonName.apply({pokemon: pokemon});
      }
    }

    ,serializeData: function(){
      var data = this.model.toJSON();
      var trainer = require('app').trainer;
      var relatedTrainer = this.model.get('relatedTrainer');
      data.related = relatedTrainer && trainer && relatedTrainer.id == trainer.id;
      return data;
    }

    ,ui: {
      'createTime': '.create-time'
    }

    ,onRender: function(){
      this.ui.createTime.tooltip({placement: 'left'});
    }
  });

  return LogView;
});