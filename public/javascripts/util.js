// jQuery extensions for 52Poké Paradise

define([
  'jquery'
  ,'jquery.transit'
  ,'bootstrap'
], function($){

  // Deferred image loading
  $.loadImage = function(src){
    return $.Deferred(function(deferred){
      var img = new Image();
      img.onload = function(){
        img.onload = null;
        deferred.resolve(img);
      };
      img.src = src;
    }).promise();
  };

  // CSS3 transition version of jQuery slideDown/slideUp
  // Inspired by https://github.com/Ilycite/zepto-slide-transition
  $.fn.transDown = function(){
    this.show();

    var position = this.css('position');
    var overflow = this.css('overflow');
    var visibility = this.css('visibility');

    this.css({
      position: 'absolute'
      ,visibility: 'hidden'
    });

    var options = {
      height: this.css('height')
      ,'padding-top': this.css('padding-top')
      ,'padding-bottom': this.css('padding-bottom')
      ,'margin-top': this.css('margin-top')
      ,'margin-bottom': this.css('margin-bottom')
    };

    this.css({
      height: 0
      ,'padding-top': 0
      ,'padding-bottom': 0
      ,'margin-top': 0
      ,'margin-bottom': 0
      ,'overflow': 'hidden'
      ,'visibility': visibility
      ,'position': position
    }).offset();

    return this.transition.bind(this, options).apply(this, arguments)
    .promise().done(function(){
      this.css({ 'overflow': overflow });
    });
  };

  $.fn.transUp = function(){
    var overflow = this.css('overflow');

    var options = {
      height: this.css('height')
      ,'padding-top': this.css('padding-top')
      ,'padding-bottom': this.css('padding-bottom')
      ,'margin-top': this.css('margin-top')
      ,'margin-bottom': this.css('margin-bottom')
    }

    this.css($.extend({ 'overflow': 'hidden' }, options)).offset();
    return this.transition.bind(this, {
      height: 0
      ,'padding-top': 0
      ,'padding-bottom': 0
      ,'margin-top': 0
      ,'margin-bottom': 0
    }).apply(this, arguments)
    .promise().done(function(){
      this.css($.extend({ 'overflow': overflow }, options)).hide();
    });
  };

  // iOS7 style switch
  // Inspired by https://github.com/mnmly/ios7-switch
  $.fn.iosSwitch = function(){
    if (this.prop('type') != 'checkbox') return;

    this.hide();

    var el = $('<div/>').addClass('ios-switch').insertBefore(this);
    $('<div/>').addClass('on-background background-fill').appendTo(el);
    $('<div/>').addClass('state-background background-fill').appendTo(el);
    $('<div/>').addClass('handle').appendTo(el);

    this.filter(':checked').prev().addClass('on');
  };

  $(document).on('click', '.ios-switch', function(){
    var me = $(this), input = me.next();
    if (me.hasClass('on')) {
      me.removeClass('on').addClass('off');
      input.prop('checked', false);
    } else {
      me.removeClass('off').addClass('on');
      input.prop('checked', true);
    }
    me.find('.handle').addClass('handle-animate');
    input.trigger('change');
  });

  $(document).on('webkitAnimationEnd animationend', '.ios-switch .handle', function(){
    $(this).removeClass('handle-animate');
  });

  // Simply reset scrollTop
  $.fn.appear = function(){
    if ($(window).scrollTop() > this.offset().top) {
      $(window).scrollTop(this.offset().top);
    }
  }

  return $;
});