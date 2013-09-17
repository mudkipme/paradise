define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'marionette'
  ,'kinetic'
  ,'i18next'
  ,'vent'
  ,'text!templates/home.html'
  ,'util'
], function($, _, Backbone, Marionette, Kinetic, i18n, vent, homeTemplate){

  var HomeView = Marionette.ItemView.extend({
    id: 'home-view'

    ,ui: {
      nav: '#paradise-nav'
      ,bottomIcons: '.bottom-icons'
    }

    ,events: {
      'click .bottom-icons a[href]': 'navigate'
      ,'click .icon-luck': 'luckSpecies'
    }

    ,template: _.template(homeTemplate)
    ,templateHelpers: { t: i18n.t }

    ,options: {
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
      hoverDuration: 0.25,
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

    ,initialize: function(){
      var opt = this.options;

      this.angles = [
        opt.smallAngle / 2 + opt.bigAngle,
        opt.smallAngle * 1.5 + opt.bigAngle * 2,
        Math.PI - opt.smallAngle * 1.5 - opt.bigAngle,
        Math.PI - opt.smallAngle / 2,
        opt.smallAngle / 2 + opt.bigAngle - Math.PI,
        opt.smallAngle * 1.5 + opt.bigAngle * 2 - Math.PI,
        - opt.smallAngle * 1.5 - opt.bigAngle,
        - opt.smallAngle / 2
      ];
    }

    ,onClose: function(){
      var stage = this.layer.getStage();
      stage && stage.destroy();
      $('body').css('cursor', '');
    }

    ,drawSector: function(data, pos){
      var me = this, opt = me.options;

      // determine arc path
      var beginAngle = me.angles[pos];

      // determine text position
      var textX = Math.abs(beginAngle) < Math.PI / 2 ? opt.textDistance : - opt.textDistance - opt.textWidth;

      var textY = (opt.textDistance + opt.textWidth / 3 - opt.fontSize / 2)
        * Math.abs(Math.tan(beginAngle - opt.bigAngle / 2))
        * beginAngle / Math.abs(beginAngle);
      
      var group = new Kinetic.Group({name: 'angle_' + beginAngle});

      var shape = new Kinetic.Shape({
        drawFunc: function(ctx){
          ctx.beginPath();
          ctx.arc(opt.width / 2, opt.height / 2, opt.centerRadius, beginAngle, beginAngle - opt.bigAngle, true);
          ctx.arc(opt.width / 2, opt.height / 2, opt.width / 2, beginAngle - opt.bigAngle, beginAngle, false);
          ctx.closePath();
          ctx.fillStrokeShape(this);
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

      var tween = null;

      group.on('mouseenter touchstart', function(){
        me.patternLoad.done(function(patternImg){
          if (!tween) {
            var patternShape = shape.clone({
              fillPatternImage: patternImg,
              fillPriority: 'pattern',
              opacity: 0
            });
            group.add(patternShape);
            tween = new Kinetic.Tween({
              node: patternShape, 
              duration: me.options.hoverDuration,
              opacity: 1,
              easing: Kinetic.Easings.EaseInOut
            });
          }
          tween.play();
        })
        $('body').css('cursor', 'pointer');
      }).on('mouseleave touchend touchmove', function(){
        tween && tween.reverse();
        $('body').css('cursor', '');
      }).on('click tap', function(){
        tween && tween.pause();
        me.scatter(group, function(){
          Backbone.history.navigate(data.href, {trigger: true});
        });
      });

      me.layer.add(group);
    }

    ,drawCenter: function(){
      var me = this, opt = me.options;

      return $.loadImage(opt.centerImage).done(function(img){
        var tween, image = new Kinetic.Image({
          x: (opt.width - img.width) / 2,
          y: (opt.height - img.height) / 2,
          image: img,
          width: img.width,
          height: img.height,
          filter: Kinetic.Filters.Brighten
        });
        image.on('mouseenter touchstart', function(){
          if (!tween) {
            tween = new Kinetic.Tween({
              node: image,
              duration: opt.hoverDuration,
              filterBrightness: 50,
              easing: Kinetic.Easings.EaseInOut
            });
          }
          tween.play();
          $('body').css('cursor', 'pointer');
        }).on('mouseleave touchend touchmove', function(){
          tween && tween.reverse();
          $('body').css('cursor', '');
        }).on('click tap', function(){
          tween && tween.pause();
          me.scatter(null, function(){
            Backbone.history.navigate('/party', {trigger: true});
          });
        });
        me.layer.add(image);
      });
    }

    ,onRender: function(){
      var me = this, opt = me.options;

      var stage = new Kinetic.Stage({
        container: me.ui.nav.get(0),
        width: opt.width,
        height: opt.height
      });

      me.layer = new Kinetic.Layer();

      _.each(opt.items, me.drawSector, me);
      me.drawCenter().done(function(){
        stage.add(me.layer);
      });

      me.patternLoad = $.loadImage(opt.pattern);

      if ($('html').hasClass('no-touch')) {
        me.$('[title]').tooltip();
      }
    }

    ,scatter: function(group, callback){
      var me = this, opt = me.options;

      $.when.apply($, _.map(me.layer.children, function(item){
        var angle, tween, deferred = $.Deferred();
        var tweenOpts = {
          node: item, 
          duration: opt.exitDuration,
          easing: Kinetic.Easings.EaseInOut,
          onFinish: function(){
            deferred.resolve();
          }
        };

        if (item.nodeType == 'Group' && item != group) {
          angle = parseFloat(item.getName().split('_')[1]) - opt.smallAngle / 2;
          _.extend(tweenOpts, {
            x: opt.width / 2 * Math.cos(angle),
            y: opt.width / 2 * Math.sin(angle)
          });
        } else {
          _.extend(tweenOpts, {
            opacity: 0
          });
        }

        new Kinetic.Tween(tweenOpts).play();
        return deferred.promise();
      }).concat(me.ui.bottomIcons.transition({opacity: 0}, opt.exitDuration * 1000).promise()))
      .done(callback);
    }

    ,navigate: function(e){
      e.preventDefault();
      Backbone.history.navigate(e.target.pathname, {trigger: true});
    }

    ,luckSpecies: function(){
      var species = i18n.t('pokemon:' + this.model.get('luckSpecies').name);
      vent.trigger('modal', {
        title: i18n.t('modal.lucky-title')
        ,content: i18n.t('modal.lucky-content', {species: species})
        ,type: 'confirm'
        ,btnType: 'info'
        ,accept: function(){
          window.open('http://wiki.52poke.com/wiki/' + encodeURIComponent(species));
        }
      });
    }
  });

  return HomeView;
});
