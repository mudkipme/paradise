define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'text!templates/admin.html'
  ,'util'
], function($, _, Marionette, i18n, adminViewTemplate){

  var Gender = { female: 1, male: 2, genderless: 3 };

  var AdminView = Marionette.ItemView.extend({
    id: 'admin-view'

    ,template: _.template(adminViewTemplate)
    ,templateHelpers: { t: i18n.t, Gender: Gender }

    ,ui: {
      tabs: '.nav-tabs'
      ,giftPokemon: '.gift-pokemon'
      ,giftPokemonSpecies: '.gift-pokemon [name="speciesNumber"]'
      ,giftPokemonNickname: '.gift-pokemon [name="nickname"]'
      ,giftPokemonFormLine: '.gift-pokemon-form-line'
      ,giftPokemonSubmit: '.gift-pokemon button[type="submit"]'
    }

    ,events: {
      'change @ui.giftPokemonSpecies': 'displayGiftPokemonForm'
      ,'submit @ui.giftPokemon': 'giftPokemon'
      ,'change .gift-pokemon .form-control': 'giftPokemonRestore'
    }

    ,modelEvents: {
      'change': 'render'
    }

    ,onRender: function(){
      this.displayGiftPokemonForm();
    }

    // Display the formes of Pokémon Species
    ,displayGiftPokemonForm: function(){
      var select = this.ui.giftPokemonFormLine.find('select');
      var speciesNumber = this.ui.giftPokemonSpecies.val();
      var species = _.findWhere(this.model.get('forms'), {speciesNumber: speciesNumber});
      select.empty();
      this.ui.giftPokemonFormLine.hide();

      species && this.ui.giftPokemonNickname.prop('placeholder', i18n.t('pokemon:'+species.name));

      if (species && species.forms.length > 1) {
        this.ui.giftPokemonFormLine.show();
        _.each(species.forms, function(form){
          $('<option/>').text(i18n.t('forme.' + (form || 'normal')))
            .val(form).appendTo(select);
        });
      }
    }

    ,giftPokemon: function(e){
      e.preventDefault();
      var params = this.ui.giftPokemon.serializeArray();
      params = _.object(_.pluck(params, 'name'), _.pluck(params, 'value'));
      params.trainer = params.trainer.split(',');

      this.ui.giftPokemon.find('[data-stat]').each(function(){
        if ($(this).val()) {
          params.individual = params.individual || {};
          params.individual[$(this).data('stat')] = parseInt($(this).val());
        }
      });
      
      this.ui.giftPokemonSubmit.prop('disabled', true);
      this.model.giftPokemon(params);
    }

    ,giftPokemonRestore: function(){
      this.ui.giftPokemonSubmit.prop('disabled', false);
    }
  });
  
  return AdminView;
});