var _ = require('underscore');
var async = require('async');
var Type = require('./type');

var crits = [0.0625, 0.125, 0.25, 0.333, 0.5];
var stages = {
  '-6': 0.25, '-5': 0.29, '-4': 0.33, '-3': 0.4, '-2': 0.5,
  '-1': 0.67, 0: 1, 1: 1.5, 2: 2, 3: 2.5,
  4: 3, 5: 3.5, 6: 4
};

var battleStat = function(pokemon){
  var pokemonStats = pokemon.stats;
  var result = {
    pokemon: pokemon
    ,types: pokemon.species.types
    ,level: pokemon.level
    ,hp: stats.hp
    ,maxHp: stats.maxHp
    ,attack: stats.attack
    ,defense: stats.defense
    ,'special-attack': stats['special-attack']
    ,'special-defense': stats['special-defense']
    ,speed: stats.speed
    ,holdItem: pokemon.holdItem
    ,accuracy: 1
    ,evasion: 1
    ,attackStage: 0
    ,spAtkStage: 0
    ,criticalStage: 0
  };

  if (pokemon.holdItem) {
    pokemon.holdItem.beforeBattle(pokemon, result);
  }

  return result;
};

var Battle = function(pokemonA, pokemonB, callback){

  var battle = Object.create(battleProto);
  battle.pokemonA = pokemonA;
  battle.pokemonB = pokemonB;
  battle.statA = battleStat(pokemonOne);
  battle.statB = battleStat(pokemonTwo);
  battle.roundCount = 0;
  battle.result = battle.round(true);

  // Gain Experience
  if (battle.winner.trainer) {

  }

  // Lose HP
  if (battle.loser.trainer) {

  }
};

var battleProto = {
  round: function(endless){
    var first, second, movementA, movementB;

    var movementA = this.statA.holdItem && this.statA.holdItem.movement();
    var movementB = this.statB.holdItem && this.statB.holdItem.movement();

    if ((movementA == 1 && movementB != 1) || (movementB == 2 && movementA != 2)) {
      first = this.statA;
      second = this.statB;
    } else if ((movementA != 1 && movementB == 1) || (movementA == 2 && movementB != 2)) {
      first = this.statB;
      second = this.statA;
    } else if (this.statA.speed > this.statB.speed ||
      (this.statA.speed == this.statB.speed && _.random(0, 1) == 0)) {
      first = this.statA;
      second = this.statB;
    } else {
      first = this.statB;
      second = this.statA;
    }

    this.roundCount++;
    if (this.roundCount > 100) {
      return this.endMatch();
    }

    this.attack(first, second, 1);

    if (this.statA.hp == 0 || this.statB.hp == 0)
      return this.endMatch(callback);

    this.attack(second, first, 2);

    if (this.statA.hp == 0 || this.statB.hp == 0)
      return this.endMatch(callback);

    if (endless) {
      return round(true);
    }
  }

  ,attack: function(attacker, defender, order){
    // The attack base power differs from 50 to 100
    var power = _.random(10, 20) * 5;
    var special;
    var typeId = _.random(1, 50);

    // Accuracy differs from 70 to 100
    var accuracy = _.random(14, 20) * 5;
    accuracy *= attacker.accuracy / defender.evasion;

    // Modify accuracy by hold item
    if (attacker.holdItem) {
      accuracy = attacker.holdItem.accuracy(accuracy, order);
    }

    // Attack missed
    if (Math.random() > accuracy) return;

    // Choose the attack type,
    // 66% it would be either one of the attacker's type
    // 2% each type in all types
    if (typeId > Type.total) {
      typeId = attacker.types[_.random(0, attacker.types.length - 1)].id;
    }

    var spAtk = attacker['special-attack'] * stages[attacker.spAtkStage];
    var attack = attacker.attack * stages[attacker.attackStage];

    // Whether it's a special attack, 1/2 decided by stats, 1/2 randomly
    if (_.random(0, 1) != 0) {
      special = spAtk > attack;
    } else {
      special = _.random(0, 1) == 0;
    }

    // Caculate damage
    var damage = (2 * attacker.level + 10) / 250 * (special ? spAtk / defender['special-defense'] : attack / defender.defense) * power + 2;

    // STAB
    if (_.contains(_.pluck(attacker.types, 'id'), typeId)) {
      damage *= 1.5;
    }

    // Critical hit
    var critical = false;
    if (Math.random() < crits[attacker.criticalStage]) {
      damage *= 2;
      critical = true;
    }

    // Type
    _.each(defender.types, function(type){
      damage *= type.damageBy(typeId) / 100;
    });

    // Random
    damage *= Math.round(_.random(85, 100) / 100);

    var options = {
      typeId: typeId
      ,critical: critical
      ,special: special
      ,attacker: attacker
      ,defender: defender
      ,damage: damage
      ,order: order
    };

    if (attacker.holdItem) {
      attacker.holdItem.afterRoundAttacker(options);
    }

    if (defender.holdItem) {
      defender.holdItem.afterRoundDefender(options);
    }

    defender.hp -= options.damage;
    if (defender.hp < 0) {
      defender.hp = 0;
    }
  }

  ,endMatch: function(){
    if (statA.hp > statB.hp) {
      this.winner = this.pokemonA;
      this.loser = this.pokemonB;
      return 'win';
    } else if (statB.hp > statA.hp) {
      this.winner = this.pokemonB;
      this.loser = this.pokemonA;
      return 'lose';
    }

    return 'draw';
  }
};

module.exports = Battle;