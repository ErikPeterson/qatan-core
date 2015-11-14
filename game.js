'use strict';

const EventEmitter = require('events');
const shuffle = require('array-shuffle');
const Board = require('./board.js');

const defaults = {
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

let turn = 0;
const players = [];

class Game extends EventEmitter {
    constructor(options){
        super();
        this.opts = Object.assign({}, defaults, options || {});
        this.__constructPromises();
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
        Promise.all(boardPromise, playerPromse)
            .then(()=>this.emit('game:ready', this));
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
}

module.exports = Game;