define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'models/item'
  ,'collections/bag'
], function($, _, Backbone, Item, Bag){

  var Pocket = Backbone.Collection.extend({
    model: Item

    ,state: {
      pocket: 'misc'
      ,currentPage: 1
      ,pageSize: 6
      ,totalPages: 0
    }

    ,constructor: function(bagOptions, options){
      options = options || {};
      this.bag = new Bag([], bagOptions);
      _.extend(this.state, _.pick(options, ['pocket', 'currentPage', 'pageSize']));
      Backbone.Collection.call(this, [], options);
    }

    ,initialize: function(){
      this.listenTo(this.bag, 'add remove change', this.refresh);
    }

    ,refresh: function(e){
      var me = this;
      var pageSize = this.state.pageSize;
      var currentPage = this.state.currentPage;

      var pocket = this.bag.filter(function(item){
        return item.get('item').pocket == me.state.pocket;
      });

      var totalPages = Math.ceil(pocket.length / pageSize);
      this.state.totalPages = totalPages;

      if (currentPage < 1) {
        this.state.currentPage = currentPage = 1;
      }
      if (currentPage > totalPages) {
        this.state.currentPage = currentPage = totalPages;
      }

      this.set(pocket.slice((currentPage - 1) * pageSize,
        currentPage * pageSize));

      this.trigger('refresh');
    }

    ,getPage: function(page){
      this.state.currentPage = page;
      this.refresh();      
    }

    ,switchPocket: function(pocket){
      this.state.pocket = pocket;
      this.state.currentPage = 1;
      this.refresh();
    }

    ,fetch: function(options){
      return this.bag.fetch(options);
    }
  });

  return Pocket;
});