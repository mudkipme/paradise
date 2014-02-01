define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'text!templates/setting.html'
  ,'util'
], function($, _, Marionette, i18n, vent, settingViewTemplate){

  var SettingView = Marionette.ItemView.extend({
    id: 'setting-view'

    ,template: _.template(settingViewTemplate)
    ,templateHelpers: { t: i18n.t }

    ,modelEvents: {
      'change': 'render'
    }

    ,events: {
      'change .accept-battle': 'acceptBattle'
      ,'click .update-location': 'updateLocation'
    }

    ,onRender: function(){
      this.$('input[type="checkbox"]').iosSwitch();
    }

    ,acceptBattle: function(e){
      e.preventDefault();
      this.model.save({acceptBattle: $(e.currentTarget).prop('checked')}, {patch: true, silent: true});
    }

    ,locationFail: function(e){
      me.$('.update-location').prop('disabled', false);
      vent.trigger('alert', {
        type: 'warning'
        ,title: i18n.t('action.update-location')
        ,content: i18n.t('action.update-location-fail')
      });
    }

    ,locationSuccess: function(e){
      me.$('.update-location').prop('disabled', false);
      vent.trigger('alert', {
        type: 'success'
        ,title: i18n.t('action.update-location')
        ,content: i18n.t('action.update-location-done')
      });
    }

    ,updateLocation: function(e){
      e.preventDefault();

      var me = this;
      me.$('.update-location').prop('disabled', true);

      try {
        navigator.geolocation.getCurrentPosition(function(pos){
          if (!_.isNumber(pos.coords.latitude))
            return me.locationFail();

          me.model.save({realWorld: {
            latitude: pos.coords.latitude
            ,longitude: pos.coords.longitude
          }}, {patch: true, wait: true})
          .done(function(){
            me.locationSuccess();
          });

        }, _.bind(me.locationFail, me));
      } catch(e){
        me.locationFail();
      }
    }

  });

  return SettingView;
});