'use strict';

const EventEmitter = require('events');
const shuffle = require('shuffle-array');
const NUMBERS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
const PLACEMENT_REGEX = /^random|classic$/;
const HexMap = require('./hexmap');

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
		this.hexmap = new HexMap(this.tiles);
	}

	__getNumber(type){
		this.numbers = this.numbers || shuffle(NUMBERS);
		return type === 'desert' ? null : this.numbers.pop();
	}

	static validateOptions(options){
        let message = '';
        let invalid = Object.keys(options)
                    .some(function(key){
                        let method = `validate_${key.toUppercase(0)}`;
                        if(!method in Board){
                            message = `${key}: Invalid configuration key`;
                            return true;
                        } 
                        let optValid = Board[method](options));
                        if(optValid){
                            message = optValid;
                            return true;
                        }
                        return false;
                    });

        return invalid ? message : false;


        
        let landsInvalid = ('lands' in board) ? validate_lands(board.lands) : false;
        if(landsInvalid) return landsInvalid;
	}

	static validate_placement(options){
        let isarray = Array.isArray(options.placement);
        let istring = (typeof options.placement === 'string');
        if(!isarray && !istring) return "placement: Must be of type Array or String";
        if(isarray) return Board.validate_serialized_tiles(options);
        if(!PLACEMENT_REGEX.test(options.placement)) return `placement: '${options.placement}' is not a valid setting`;
		return false;
	}
}

module.exports = Board;