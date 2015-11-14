'use strict';

const EventEmitter = require('events');
const shuffle = require('shuffle-array');
const NUMBERS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
const Map = require('./map');

class Board extends EventEmitter {

	constructor(options){
		super();
		this.opts = Object.clone(options || {});
		this.__distributeTiles();
		this.__setMap();
	}

	__distributeTiles(){
		let landTypes = Object.keys(this.opts.lands);
		let distribution = [];

		landTypes.forEach(function(type){
			distribution.concat(Array(this.opts.lands[type]).fill(type));
		}, this);

		this.tiles = distribution
						.map((type)=>{ return {type: type, number: this.__getNumber(type)}; });
	}

	__setMap(){
		this.map = new Map(this.tiles);
	}

	__getNumber(type){
		this.numbers = this.numbers || shuffle(NUMBERS);
		return type === 'desert' ? null : this.numbers.pop();
	}
}

module.exports = Board;