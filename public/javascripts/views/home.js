define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'marionette'
  ,'kinetic'
  ,'i18next'
  ,'text!templates/home.html'
], function($, _, Backbone, Marionette, Kinetic, i18n, homeTemplate){

  var HomeView = Marionette.ItemView.extend({
    id: 'home-view'
    ,className: 'hidden-sm'

    ,ui: {
      nav: '#paradise-nav'
      ,bottomIcons: '.bottom-icons'
    }

    ,template: _.template(homeTemplate)

    ,config: {
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
      items: [
        {
          href: '/bag'
          ,color: '#9c59b8'
          ,text: 'menu.bag'
        }
        ,{
          href: '/battle'
          ,color: '#96a6a6'
          ,text: 'menu.battle-tower'
        }
        ,{
          href: '/daycare'
          ,color: '#fff'
          ,textColor: '#96a6a6'
          ,text: 'menu.day-care'
        }
        ,{
          href: '/pokemart'
          ,color: '#f1c40f'
          ,text: 'menu.poke-mart'
        }
        ,{
          href: '/pokedex'
          ,color: '#e77e23'
          ,text: 'menu.pokedex'
        }
        ,{
          href: '/world'
          ,color: '#e84c3d'
          ,text: 'menu.pokemon-world'
        }
        ,{
          href: '/timeline'
          ,color: '#2fcc71'
          ,text: 'menu.timeline'
        }
        ,{
          href: '/storage'
          ,color: '#3598dc'
          ,text: 'menu.storage'
        }
      ]
    }

    ,onClose: function(){
      var stage = this.layer.getStage();
      stage && stage.destroy();
      $('body').css('cursor', '');
    }

    ,drawSector: function(data, pos){
      var beginAngle, textX, textY, me = this,
        opt = me.config,
        layer = me.layer;

      // determine arc path
      var angles = [
        opt.smallAngle / 2 + opt.bigAngle,
        opt.smallAngle * 1.5 + opt.bigAngle * 2,
        Math.PI - opt.smallAngle * 1.5 - opt.bigAngle,
        Math.PI - opt.smallAngle / 2,
        opt.smallAngle / 2 + opt.bigAngle - Math.PI,
        opt.smallAngle * 1.5 + opt.bigAngle * 2 - Math.PI,
        - opt.smallAngle * 1.5 - opt.bigAngle,
        - opt.smallAngle / 2
      ]; 
      
      beginAngle = angles[pos];

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
        text: i18n.t(data.text)
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
        me.scatter(group, function(){
          Backbone.history.navigate(data.href, {trigger: true});
        });
      });

      layer.add(group);
    }

    ,onRender: function(){
      var me = this, opt = me.config;

      var stage = new Kinetic.Stage({
        container: me.ui.nav.get(0),
        width: opt.width,
        height: opt.height
      });

      var layer = new Kinetic.Layer();
      me.layer = layer;

      _.each(opt.items, function(item, i){
        me.drawSector(item, i);
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
            this.setFilterBrightness(50);
            layer.draw();
            $('body').css('cursor', 'pointer');
          }).on('mouseleave touchend touchmove', function(){
            layer.clear();
            this.clearFilter();
            layer.draw();
            $('body').css('cursor', '');
          }).on('click tap', function(){
            me.scatter(null, function(){
              Backbone.history.navigate('/party', {trigger: true});
            });
          });
          layer.add(image);
          stage.add(layer);
        };
        img.src = opt.centerImage;
      } else {
        stage.add(layer);
      }
    }

    ,scatter: function(group, callback){
      var me = this, opt = me.config;

      _.each(me.layer.children, function(item){
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

      me.ui.bottomIcons.fadeOut(opt.exitDuration * 1000).promise().done(callback);
    }
  });
  return HomeView;
});