define([
  'jquery',
  'underscore',
  'backbone',
  'kinetic',
  'i18next',
  'text!templates/home.html',
], function($, _, Backbone, Kinetic, i18n, homeTemplate){

  var HomeView = Backbone.View.extend({
    id: 'home-view',
    className: 'hidden-phone',

    render: function(config){
      var data = { t: i18n.t };
      this.$el.html(_.template(homeTemplate, data));

      this.nav = this.$('#paradise-nav');
      this.bottomIcons = this.$('.bottom-icons');

      this.config = this.getConfig(config);
      this.draw();

      return this;
    },

    remove: function(){
      var stage = this.layer.getStage();
      stage && stage.destroy();
      $('body').css('cursor', '');
      Backbone.View.prototype.remove.call(this);
    },

    getConfig: function(opts){
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
        items: [
          {
            href: '/world'
            ,pos: 6
            ,color: '#e84c3d'
            ,text: i18n.t('menu.pokemon-world')
          }
          ,{
            href: '/pokedex'
            ,pos: 5
            ,color: '#e77e23'
            ,text: i18n.t('menu.pokedex')
          }
          ,{
            href: '/pokemart'
            ,pos: 4
            ,color: '#f1c40f'
            ,text: i18n.t('menu.poke-mart')
          }
          ,{
            href: '/daycare'
            ,pos: 3
            ,color: '#fff'
            ,textColor: '#96a6a6'
            ,text: i18n.t('menu.day-care')
          }
          ,{
            href: '/timeline'
            ,pos: 7
            ,color: '#2fcc71'
            ,text: i18n.t('menu.timeline')
          }
          ,{
            href: '/storage'
            ,pos: 8
            ,color: '#3598dc'
            ,text: i18n.t('menu.storage')
          }
          ,{
            href: '/bag'
            ,pos: 1
            ,color: '#9c59b8'
            ,text: i18n.t('menu.bag')
          }
          ,{
            href: '/battle'
            ,pos: 2
            ,color: '#96a6a6'
            ,text: i18n.t('menu.battle-tower')
          }
        ]
      };

      return _.defaults(opts || {}, defaultOpts);
    },

    drawSector: function(data){
      var beginAngle, textX, textY, me = this,
        opt = me.config,
        layer = me.layer;

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
        me.scatter(group, function(){
          Backbone.history.navigate(data.href, {trigger: true});
        });
      });

      layer.add(group);
    },

    draw: function(){
      var me = this, opt = me.config;

      var stage = new Kinetic.Stage({
        container: me.nav.get(0),
        width: opt.width,
        height: opt.height
      });

      var layer = new Kinetic.Layer();
      me.layer = layer;

      _.each(opt.items, function(item){
        me.drawSector(item);
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
    },

    scatter: function(group, callback){
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

      me.bottomIcons.fadeOut(opt.exitDuration * 1000).promise().done(callback);
    }
  });
  return HomeView;
});