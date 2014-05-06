define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'vent'
  ,'views/party-popover'
  ,'util'
], function($, _, Marionette, vent, PartyPopoverView){

  var PartyPopover = Marionette.Behavior.extend({
    defaults: {
      placement: 'bottom'
    }

    ,ui: {
      btnPartyPopover: '.btn-party-popover'
    }

    ,events: {
      'shown.bs.popover @ui.btnPartyPopover': 'showPartyPopover'
      ,'shown.bs.popover @ui.btnPartyPopover': 'showPartyPopover'
      ,'selectPokemon @ui.btnPartyPopover': 'selectPokemon'
    }

    ,onRender: function(){
      var me = this;

      me.listenTo(vent, 'popover', me.hidePopover);
      me.partyPopover = new PartyPopoverView({
        collection: require('app').trainer.party
      });
      me.partyPopover.render();

      me.ui.btnPartyPopover.popover(_.extend({
        html: true
        ,content: me.partyPopover.el
        ,container: me.$el
      }, me.options));
    }

    ,showPartyPopover: function(e){
      this.partyPopover.delegateEvents();
      this.partyPopover.options.button = $(e.currentTarget);
      require('app').trainer.fetch();
    }

    ,onClose: function(){
      this.partyPopover && this.partyPopover.close();
      this.ui.btnPartyPopover.popover('destroy');
    }

    ,hidePopover: function(e){
      this.ui.btnPartyPopover.each(function(i, button){
        if (!e || button !== e.target) {
          var popover = $(button).data('bs.popover');
          popover && popover.leave(popover);
        }
      });
    }

    ,selectPokemon: function(){
      this.hidePopover();
    }
  });

  return PartyPopover;
});