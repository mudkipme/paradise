define([
  'jquery',
  'underscore',
  'backbone',
  'kinetic',
  'color',
  'text!templates/home.html',
  'i18n!nls/messages'
], function($, _, Backbone, Kinetic, Color, homeTemplate, messages){

  var HomeView = Backbone.View.extend({
    el: $('#paradise-app'),

    events: {
      "touchstart .paradise-nav-text li": "mobileTouch",
      "touchend .paradise-nav-text li":   "mobileTouchEnd",
      "touchcancel .paradise-nav-text li":  "mobileTouchCancel",
      "touchmove .paradise-nav-text li":  "mobileTouchCancel"
    },

    render: function(){
      var data = { messages: messages };
      this.$el.empty().append(_.template(homeTemplate, data));

      this.navList = this.$('.paradise-nav-text li');
      this.navDesktop = this.$('#paradise-nav');
      this.bottomIcons = this.$('.bottom-icons');

      this.desktopConfig = this.getDesktopConfig();

      this.mobileConfig = { exitDuration: 0.5 };

      this.drawMobile();
      this.drawDesktop();
      this.$el.css('min-height', this.$el.height() + 'px');
    },

    destroy: function(){
      var stage = this.desktopLayer.getStage();
      stage && stage.destroy();
      this.undelegateEvents();
      this.$el.empty();
      $('body').css('cursor', '');
    },

    drawMobile: function(){
      this.navList.each(function(i, li){
        $(li).css('background-color', $(li).data('color'));
        var textColor = $(li).data('text-color');
        if (textColor) {
          $(li).css({
            'border': '1px solid ' + textColor,
            'color': textColor
          });
        }
      });
    },

    getDesktopConfig: function(opts){
      var defaultOpts = {
        width: 810,
        height: 422,
        centerRadius: 110,
        centerImage: './images/home/pokeball.png',
        pattern: './images/home/pattern.png',
        smallAngle: 0.0641754962,
        bigAngle: 0.2904520721,
        textWidth: 140,
        textDistance: 190,
        fontFamily: '"Hiragino Sans GB", "Helvetica Neue", "Microsoft YaHei", "Microsoft JhengHei", sans-serif',
        fontSize: 18,
        fontStyle: 'bold',
        stroke: 'rgba(255,255,255,0.5)',
        textColor: '#FFF',
        exitDuration: 0.5,
        items: this.navList.map(function(i, li){
          var data = $(li).data();
          data.text = $(li).text();
          return data;
        })
      };

      return _.defaults(opts || {}, defaultOpts);
    },

    drawSector: function(data){
      var beginAngle, textX, textY, me = this,
        opt = me.desktopConfig,
        layer = me.desktopLayer;

      // determine arc path
      switch (data.pos) {
        case 1:
          beginAngle = opt.smallAngle / 2 + opt.bigAngle;
          break;
        case 2:
          beginAngle = opt.smallAngle * 1.5 + opt.bigAngle * 2;
          break;
        case 3:
          beginAngle = Math.PI - opt.smallAngle * 1.5 - opt.bigAngle;
          break;
        case 4:
          beginAngle = Math.PI - opt.smallAngle / 2;
          break;
        case 5:
          beginAngle = opt.smallAngle / 2 + opt.bigAngle - Math.PI;
          break;
        case 6:
          beginAngle = opt.smallAngle * 1.5 + opt.bigAngle * 2 - Math.PI;
          break;
        case 7:
          beginAngle = - opt.smallAngle * 1.5 - opt.bigAngle;
          break;
        case 8:
          beginAngle = - opt.smallAngle / 2;
      }

      // determine text position
      textX = Math.abs(beginAngle) < Math.PI / 2 ? opt.textDistance : - opt.textDistance - opt.textWidth;

      textY = (opt.textDistance + opt.textWidth / 3 - opt.fontSize / 2)
          * Math.abs(Math.tan(beginAngle - opt.bigAngle / 2))
          * beginAngle / Math.abs(beginAngle);
      
      var group = new Kinetic.Group({name: 'angle_' + beginAngle});

      var shape = new Kinetic.Shape({
        drawFunc: function(canvas) {
          var ctx = canvas.getContext();
          ctx.beginPath();
          ctx.arc(opt.width / 2, opt.height / 2, opt.centerRadius, beginAngle, beginAngle - opt.bigAngle, true);
          ctx.arc(opt.width / 2, opt.height / 2, opt.width / 2, beginAngle - opt.bigAngle, beginAngle, false);
          ctx.closePath();
          canvas.fillStroke(this);
        },
        fill: data.color,
        stroke: data.stroke || opt.stroke,
        strokeWidth: 1
      });

      var text = new Kinetic.Text({
        x: opt.width / 2 + textX,
        y: opt.height / 2 + textY - opt.fontSize / 2,
        width: opt.textWidth,
        align: Math.abs(beginAngle) < Math.PI / 2 ? 'left' : 'right',
        fill: data.textColor || opt.textColor,
        fontFamily: data.fontFamily || opt.fontFamily,
        fontSize: data.fontSize || opt.fontSize,
        fontStyle: data.fontStyle || opt.fontStyle,
        text: data.text
      });

      group.add(shape);
      group.add(text);

      var cloneShape = null;
      
      var loadPattern = function(callback){
        if (cloneShape) {
          return callback();
        }
        if (me.patternLoaded) {
          cloneShape = shape.clone({
            fillPatternImage: me.patternImg,
            fillPriority: 'pattern',
            opacity: 0
          });
          group.add(cloneShape);
          callback();
        }
      };

      group.on('mouseenter touchstart', function(){
        loadPattern(function(){
          new Kinetic.Tween({
            node: cloneShape, 
            duration: 0.25,
            opacity: 1,
            easing: Kinetic.Easings.EaseInOut
          }).play();
        });
        $('body').css('cursor', 'pointer');
      }).on('mouseleave touchend touchmove', function(){
        if (cloneShape) {
          new Kinetic.Tween({
            node: cloneShape, 
            duration: 0.25,
            opacity: 0,
            easing: Kinetic.Easings.EaseInOut
          }).play();
        }
        $('body').css('cursor', '');
      }).on('click tap', function(){
        me.desktopScatter(group);
      });

      layer.add(group);
    },

    drawDesktop: function(){
      var me = this, opt = me.desktopConfig;

      var stage = new Kinetic.Stage({
        container: me.navDesktop.get(0),
        width: opt.width,
        height: opt.height
      });

      var layer = new Kinetic.Layer();
      me.desktopLayer = layer;

      opt.items.each(function(i, item){
        item.pos && me.drawSector(item);
      });

      if (opt.pattern) {
        me.patternImg = new Image();
        me.patternLoaded = false;
        me.patternImg.onload = function(){
          me.patternLoaded = true;
        };
        me.patternImg.src = opt.pattern;
      }

      if (opt.centerImage) {
        var img = new Image();
        img.onload = function(){
          var image = new Kinetic.Image({
            x: (opt.width - img.width) / 2,
            y: (opt.height - img.height) / 2,
            image: img,
            width: img.width,
            height: img.height
          });
          image.on('mouseenter touchstart', function(){
            layer.clear();
            this.setFilter(Kinetic.Filters.Brighten);
            this.setFilterBrightness(-50);
            layer.draw();
            $('body').css('cursor', 'pointer');
          }).on('mouseleave touchend touchmove', function(){
            layer.clear();
            this.clearFilter();
            layer.draw();
            $('body').css('cursor', '');
          }).on('click tap', function(){
            me.desktopScatter();
          });
          layer.add(image);
          stage.add(layer);
        };
        img.src = opt.centerImage;
      } else {
        stage.add(layer);
      }
    },

    desktopScatter: function(group, callback){
      var me = this, opt = me.desktopConfig;

      _.each(me.desktopLayer.children, function(item){
        var angle, tween;

        if (item.nodeType == 'Group' && item != group) {
          angle = parseFloat(item.getName().split('_')[1]) - opt.smallAngle / 2;
          tween = new Kinetic.Tween({
            node: item, 
            duration: opt.exitDuration,
            easing: Kinetic.Easings.EaseInOut,
            x: opt.width / 2 * Math.cos(angle),
            y: opt.width / 2 * Math.sin(angle)
          });
        } else {
          tween = new Kinetic.Tween({
            node: item,
            duration: opt.exitDuration,
            easing: Kinetic.Easings.EaseInOut,
            opacity: 0
          });
        }

        tween.play();
      });

      me.bottomIcons.fadeOut(opt.exitDuration * 1000).promise().done(function(){
        me.destroy();
        callback && callback();
      });
    },

    mobileSlide: function(item, callback){
      var me = this, opt = me.mobileConfig;
      me.navList.not(item).animate({'left': '-120%'}, opt.exitDuration * 1000);
      item.add(me.bottomIcons).fadeOut(opt.exitDuration * 1000);

      me.navList.add(me.bottomIcons).promise().done(function(){
        me.destroy();
        callback && callback();
      });
    },

    mobileTouch: function(e){
      var item = $(e.target);
      item.css('background-color', Color(item.data('color')).darken(0.5).rgbString())
      .data('touching', 'yes');
    },

    mobileTouchEnd: function(e){
      var item = $(e.target);
      item.css('background-color', item.data('color'));
      if (item.data('touching')) {
        this.mobileSlide(item);
      }
    },

    mobileTouchCancel: function(e){
      var item = $(e.target);
      item.css('background-color', item.data('color'))
      .data('touching', '');
    }
  });
  return HomeView;
});