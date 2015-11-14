'use strict';

const Vertex = function(x, y, z, hexes, owner, structure){
    return {x: x, y: y, z: z, tiles: hexes, owner: owner, structure: structure};
};

class HexMap{

    constructor(tiles){
        this.tiles = tiles;
    }

    gridTile(x, y){
        let n = this.numRings - 1;
        return this.grid[n + y][x + n + Math.min(0, y)];
    }

    __makeGrid(){
        let r = this.numRings - 1;
        
        this.colsize = ( 2 * r ) + 1;
        this.__grid = [];
        
        for(let i = 0; i < this.colsize; i++){
            this.__grid.push(this.__tilesForRow(i));
        }
        
        delete this.tiles;
    }

    __tilesForRow(i){
        let roundCol = Math.round(this.colsize / 2);
        let minCol = Math.floor(this.colsize / 2);
        let num = i < this.numRings ? roundCol + i : this.colsize - i + minCol;
        let tiles = this.tiles.splice(0, num);
        let padding = i === minCol ? [] : new Array(this.colsize - num).fill(false);

        return i < this.numRings ? padding.concat(tiles) : tiles.concat(padding);
    }

    get grid(){
        if(!this.__grid) this.__makeGrid();
        return this.__grid;
    }

    get numRings(){
        if(!this.__numRings) Object.defineProperty(this, '__numRings', {enumerable: false, writable: false, configurable: false, value: ( ( this.tiles.length - 1 ) / 6 )});
        return this.__numRings;
    }

    get vertexCount() {
        if(!this.__vertexCount) this.__vertexCount = HexMap.calcVertexCount(this.numRings);
        return this.vertexCount;
    }

    static calcVertexCount(rings){
        let vertices = 0;

        for(let i = 0; i < rings; i++) vertices += i == 0 ? 6 : 18 * i;

        return vertices; 
    }

}

module.exports = HexMap;