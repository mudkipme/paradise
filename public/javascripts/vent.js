define(['jquery', 'underscore', 'backbone.wreqr', 'util'], function($, _, Wreqr){
  var vent = new Wreqr.EventAggregator();

  $(window).on('resize', _.debounce(_.bind(vent.trigger, vent, 'windowResize'), 300));
  $(document).on('show.bs.popover', _.bind(vent.trigger, vent, 'popover'));

  return vent;
});