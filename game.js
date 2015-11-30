'use strict';

const EventEmitter = require('events');
const shuffle = require('array-shuffle');
const Board = require('./board.js');

const smallDefaults = {
    players: {
        count: 3,
        placement: 'random'
    },
    pointsToWin: 10,
    board: {
        lands: {
            desert: 1,
            hills: 3,
            pastures: 4,
            fields: 4, 
            mountains: 3,
            forests: 4
        },
        placement: 'random'
    }
};

const bigDefaults = {
    players: {
        count: 5,
        placement: 'random'
    },
    pointsToWin: 10,
    board: {
        lands: {
            desert: 2,
            hills: 5,
            pastures: 6,
            fields: 6, 
            mountains: 5,
            forests: 6
        },
        placement: 'random'
    }
};

let turn = 0;
const players = [];

class Game extends EventEmitter {

    constructor(options){
        let validation = Game.validateOptions(options);
        if(validation) return this.__emitError(validation);

        super();
        this.opts = Object.assign({}, defaults, options || {});
        this.promise = this.__constructPromises();
    }
    
    get players(){
        return players;
    }

    get turn(){
        return turn;
    }

    addPlayer(options){
        if(this.players.length === this.opts.players.count) return this.__emitError('Game is full');
        this.players.push(new Player(options));
        if(this.players.length === this.opts.players.count) this.__playersReady();
    }

    __constructPromises(){
        let self = this;
        let boardPromise = new Promise(function(resolve, reject){
            try{
                self.__buildBoard();
                self.on('board:ready', resolve);
            } catch(e){
                reject(e);
            }
        });
        let playerPromise = new Promise(function(resolve){
            self.on('players:ready', resolve);
        });

        return Promise.all(boardPromise, playerPromse)
            .then(()=>this.emit('game:ready', this),
                  (err)=>this.emit('error', err));
    }

    __buildBoard(){
        this.board = new Board(this.opts.board);
        this.emit('board:ready', this.board);
    }

    __playersReady(){
        let placement = this.opts.players.placement;
        
        if(placement.call){
            this.players = placement(this.players);
        } else if(placement === 'random'){
            this.players = shuffle(this.players);
        }

        this.emit('players:ready', this.players);
    }

    __emitError(message){
        message = message || 'An error occured';
        this.emit('error', new Error(message));
    }

    static validateOptions(options){
        let message = '';
        let invalid = Object.keys(options)
                    .some(function(key){
                        let method = `validate_${key.toUppercase(0)}`;
                        if(!method in Game){
                            message = `Invalid configuration key: ${key}`;
                            return true;
                        } 
                        let optValid = Game[method](options[key]));
                        if(optValid){
                            message = optValid;
                            return true;
                        }
                        return false;
                    });
        return invalid ? message : false;
    }

    static validate_players(players){
        if(players.count > 6) return 'options.players.count: Too many players';
        if(players.count < 3) return 'options.players.count: Too few players';

        let placementRegex = /random|join|reversejoin/;
        if(!players.placement.call && !placementRegex.test(players.placement)) return "options.players.placement: Must be 'random', 'join', 'reversejoin' or an instance of Function";

        return false;
    }

    static validate_pointsToWin(pointsToWin){
        return pointsToWin < 2 ? 'options.players.pointsToWin: Must be greater than 2' : false;
    }

    static validate_board(board){
        let boardInvalid = Board.validate(board);
        return boardInvaid ? `options.board.${boardInvalid}` : false;
    }

}

module.exports = Game;