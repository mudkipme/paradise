define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'collections/daycares'
  ,'views/daycare-room'
  ,'text!templates/daycare-list.html'
  ,'util'
], function($, _, Marionette, i18n, DayCares, DayCareRoomView, dayCareListTemplate){

  var DayCareListView = Marionette.CompositeView.extend({
    id: 'day-care-carousel'
    ,className: 'carousel slide'
    ,collection: DayCares

    ,itemView: DayCareRoomView
    ,itemViewContainer: '.carousel-inner'

    ,template: _.template(dayCareListTemplate)
    ,templateHelpers: { t: i18n.t }

    ,options: {
      carouselSize: 4
    }

    ,ui: {
      carouselControl: '.carousel-control'
    }

    ,onRender: function(){
      this.$el.carousel({ interval: false });
    }

    // Create a wrapper to contains several rooms
    ,appendHtml: function(cv, iv, index){
      var $container = this.getItemViewContainer(cv);
      var itemIndex = Math.floor(index / this.options.carouselSize);
      var wrapper = $container.find('.item').eq(itemIndex);
      if (!wrapper.size()){
        wrapper = $('<div/>').addClass('item').appendTo($container);
        if (!$container.find('.item.active').size()) {
          wrapper.addClass('active');
        }
      }
      if ($container.find('.item').size() > 1) {
        this.ui.carouselControl.removeClass('hide');
      }
      wrapper.append(iv.el);
    }

    // Re-sort the day care rooms
    ,onItemRemoved: function(){
      var $container = this.getItemViewContainer(this);
      var carouselSize = this.options.carouselSize;
      this.children.each(function(view, index){
        var itemIndex = Math.floor(index / carouselSize);
        $container.find('.item').eq(itemIndex).append(view.el);
      });
      $container.find('.item').filter(':empty').remove();
      if ($container.find('.item').size() < 2) {
        this.ui.carouselControl.addClass('hide');
      }
      if ($container.find('.item').size() && !$container.find('.item.active').size()) {
        $container.find('.item:last-child').addClass('active');
      }
    }
  });

  return DayCareListView;
});