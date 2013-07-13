define([
  'jquery',
  'underscore',
  'backbone',
  'i18next',
  'text!templates/party.html',
], function($, _, Backbone, i18n, partyTemplate){

  var PartyView = Backbone.View.extend({
    id: 'party-view',

    render: function(){

    }
  });
  return PartyView;
});