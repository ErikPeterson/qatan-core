'use strict';

const expect = require('expect.js');
const Game = require('../game');
const defaults = {
    players: {
        count: 3,
        placement: 'random'
    },
    pointsToWin: 10,
    board: {
        lands: {
            desert: 1,
            hill: 3,
            pasture: 4,
            field: 4, 
            mountain: 3,
            forest: 4
        },
        placement: 'random'
    }
};

describe('Game', function(){
    describe('new Game(options={})', function(){
        it('should create a new instance of Game', function(){
            const game = new Game();
            expect(game).to.be.a(Game);
        });
        describe('options', function(){
            describe('.players (Object)', function(){
                describe('.count (Number)', function(){
                    it('sets the number of players', function(){
                        const opts = {players: {count: 4}};
                        const game = new Game(opts);
                        expect(game.opts.players.count).to.equal(4);
                    });
                    it('defaults to the minimum number of players', function(){
                        const game = new Game();
                        expect(game.opts.players.count).to.equal(3);
                    });
                    it('determines the size of the board', function(done){
                        const bigGame = new Game({players: { count: 5 }});
                        bigGame.on('board:ready', function(board){
                            expect(board.tiles.length === 30);
                            done();
                            return;
                        })
                    });
                    it(`throws an ArgumentError if there are too many 
                        or too few players`, function(){
                        const tooLarge = {players: {count: 7}};
                        const tooSmall = {players: {count: 2}};
                        expect(()=>new Game(tooLarge)).to.throwError(/too many players/i);
                        expect(()=>new Game(tooSmall)).to.throwError(/too few players/i);
                    });
                });
                describe('.placement (String|Function)', function(){
                    it('defaults to random ordering, equivalent to \'random\'', function(done){
                        const game = new Game();
                        game.on('players:ready', function(players){
                            let ids = players.map((p)=>p.id);
                            let order = ids.some(function(id, i){
                                return id !== i+1;
                            })
                            expect(order).to.be.ok();
                            done();
                        });
                        for(let i = 1; i <= 4; i++) game.addPlayer({id: i}); 
                    });
                    describe(`String`, function(){
                        describe("'join'", function(){
                            it('sorts the players in the order they joined', function(done){
                                const game = new Game({players: {placement: 'join'}});
                                game.on('players:ready', function(players){
                                    let ids = players.map((p)=>p.id);
                                    for(let i = 1; i <= 4; i++) expect(players[i].id).to.equal(i);
                                    done();
                                });
                                for(let i = 1; i <= 4; i++) game.addPlayer({id: i}); 
                            });
                        });
                        describe("'reversejoin'", function(){
                            it('sorts the players in the opposite order they joined', function(done){
                                const game = new Game({players: {placement: 'join'}});
                                game.on('players:ready', function(players){
                                    let ids = players.map((p)=>p.id);
                                    for(let i = 4; i <= 1; i--) expect(players[i].id).to.equal(i);
                                    done();
                                });
                                for(let i = 1; i <= 4; i++) game.addPlayer({id: i}); 
                            });
                        });
                    });
                    describe('Function', function(done){
                        it(`is passed the player array and must return the 
                            player array in the desired order`, function(done){
                            const fn = function(players){
                                return [3,2,0,1].map((n)=>players[n]);
                            };
                            const game = new Game({players: {placement: fn}});
                            game.on('players:ready', function(players){
                                let ids = players.map((p)=>p.id);
                                let order = [3,2,0,1];
                                for(let i = 1; i <= 4; i++) expect(players[i].id).to.equal(order[i] + 1);
                                done();
                            });
                            for(let i = 1; i <= 4; i++) game.addPlayer({id: i}); 
                        });
                    });
                });
            });
            describe('pointsToWin (Number)', function(){
                it('sets the number of points required to win the game', ()=>expect((new Game({pointsToWin: 11}).opts.pointsToWin).toEqual(11)));
                it('defaults to 10', ()=>expect((new Game()).opts.pointsToWin)).toEqual(10);
                it('throws an error if set to less than 3', function(){
                    expect(()=>{new Game({pointsToWin: 2})}).to.throwError(/must be greater than 2/i);
                });
            });
            describe('.board (Object)', function(){
                describe('.lands', function(){
                    it(`uses the standard distribution of land types
                     for the size of the game board`, function(){
                        const game = new Game();
                        expect(JSON.stringify(defaults.board.lands) === JSON.stringify(game.opts.board.lands)).to.be.ok();
                     });
                    it(`can use relative numbers to rebalance the distribution
                        of land types`, function(){
                        const opts = { board: 
                            lands: {
                                desert: 1,
                                hill: -1
                            }
                        };
                        const game = new Game(opts);
                        expect(game.opts.board.lands.desert).to.equal(2);
                        expect(game.opts.board.lands.hill).to.equal(2);
                    });
                    it(`will throw an error if any added/removed land is not balanced by
                        a removed/added land, or if any land is reduced to less than 1`, function(){
                        const tooMany = { board: 
                            lands: {
                                desert: 1
                            };
                        };                        
                        const tooFew = { board: 
                            lands: {
                                desert: 1
                            };
                        };
                        const noSheep = {
                            desert: 2,
                            field: 2,
                            pasture: -4
                        };
                        expect(()=>new Game(tooMany)).to.throwError(/too many/i);    
                        expect(()=>new Game(tooFew)).to.throwError(/too few/i);    
                        expect(()=>new Game(noSheep)).to.throwError(/missing resource/i);    
                    });
                });
                describe('.placement (String|Array)', function(){
                    it('defaults to random placement, equivalent to \'random\'', function(done){
                        const game1 = new Game();
                        const game2 = new Game();
                        let counter = 0;
                        let board2 = board1 = null
                        function boardReady(board){
                            counter++;
                            if(counter < 2) return;
                            let order1 = board1.tiles.map((tile)=>tile.type);
                            let order2 = board2.tiles.map((tile)=>tile.type);
                            let comparison = order1.some((type, i)=>{type !== order2[i]});
                            expect(comparison).to.be.ok();
                            done();
                            return;
                        }
                        game1.on('board:ready', function(board){
                            board1 = board;
                            boardReady();
                        });
                        game2.on('board:ready', function(board){
                            board2 = board;
                            boardReady();
                        });
                    });
                    describe('String', function(){
                        describe("'classic'", function(){
                            let game = null;
                            const arrangement = [['forest', 6],['field', 5],['mountain', 9],
                                                ['hill',4],['pasture',3],['hill',8],['mountain',10],
                                                ['mountain', 6],['pasture', 5],['desert', null],['field', 9],['pasture', 12],
                                                ['hill', 3],['forest', 2],['field', 10],['forest', 11],
                                                ['field', 11],['forest', 4],['pasture', 8]];
                            before(function(done){
                                game = new Game({ board: { lands:{ desert: 1, hill: -1 }, placement: 'classic' } });
                                game.on('board:ready', function(){
                                    done();
                                    return;
                                });
                            });
                            it('arranges the game board in a balanced manner', function(){
                                const actual = game.board.serializeTiles();
                                const comparison = actual.every((tile, i)=>{tile[0] === arrangement[i][0] && tile[1] === arrangement[i][1]});
                                expect(comparison).to.be.ok();
                            });
                            it('ignores any changes to the default tile set', function(){
                                expect(JSON.stringify(game.opts.board.lands) === JSON.stringify(defaults.board.lands));
                            });
                        });
                    });
                    describe('Array', function(){
                        let game = null;
                        const arrangement = [['forest', 6],['field', 5],['mountain', 9],
                                            ['hill',4],['pasture',3],['hill',8],['mountain',10],
                                            ['mountain', 5],['pasture', 6],['desert', null],['field', 9],['pasture', 12],
                                            ['hill', 3],['forest', 2],['field', 10],['forest', 11],
                                            ['field', 11],['forest', 4],['pasture', 8]];
                        before(function(done){
                            game = new Game({ board: { lands:{ desert: 1, hill: -1 }, placement: arrangement } });
                            game.on('board:ready', function(){
                                done();
                                return;
                            });
                        });
                        it(`arranges the board from the top left to bottom right according to an array
                            of arrays with the format [String: land type, Number: tile number]`, function(){
                                const actual = game.board.serializeTiles();
                                const comparison = actual.every((tile, i)=>{tile[0] === arrangement[i][0] && tile[1] === arrangement[i][1]});
                                expect(comparison).to.be.ok();
                        });
                        it('ignores any configuration in the .lands options', function(){
                            expect(game.opts.board.lands.desert === 0).to.be.ok();
                            expect(game.opts.board.lands.hill === 8).to.be.ok();
                        });
                    });
                });
            });
        })
    });
});