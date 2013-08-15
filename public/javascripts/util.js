// jQuery extensions for 52Poké Paradise

define([
  'jquery'
  ,'jquery.transit'
  ,'bootstrap'
  ,'bootstrap/switch'
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

    return this.css({
      height: 0
      ,'padding-top': 0
      ,'padding-bottom': 0
      ,'margin-top': 0
      ,'margin-bottom': 0
      ,'overflow': 'hidden'
      ,'visibility': visibility
      ,'position': position
    }).transition.bind(this, options).apply(this, arguments)
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

    return this.css($.extend({ 'overflow': 'hidden' }, options))
    .transition.bind(this, {
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

  return $;
});