import { Team, svgMarkup } from "./consts";
import { DomTools } from "./domTools"
import { AI } from "./gameAI";

export enum GameState {
    Tie,
    Win,
    Running
}

export class TicTacToe {

    parentElem : HTMLElement
    boardElem : HTMLElement
    callback : Function | null
    backButton : HTMLElement
    cpuCounterElem: HTMLElement;
    playerCounterElem: HTMLElement;

    //Tic tac toe State:
    playerTeam !: Team
    board !: (Team|null)[]
    turnsPassed !: number
    currentTurn !: Team
    cpuGamesWon : number
    playerGamesWon : number
    aiCallback !: number
    animTimeout !: number
    // /tic tac toe State

    constructor(parentElem : HTMLElement){
        this.parentElem = parentElem
        let gameFragment = document.createRange().createContextualFragment(
            `
            <div class="board">
                <div data-cell-id="0" class="cell"></div><div data-cell-id="1" class="cell"></div><div data-cell-id="2" class="cell"></div><div data-cell-id="3" class="cell"></div>
                <div data-cell-id="4" class="cell"></div><div data-cell-id="5" class="cell"></div><div data-cell-id="6" class="cell"></div>
                <div data-cell-id="7" class="cell"></div><div data-cell-id="8" class="cell"></div>
            </div>
            <div class="bottom-hud ui-block">
            <div class="tally"><div class="number" id="player-tally">0</div><div class="playerName">You</div></div>
            <button class="go-back">Start Again</button>
            <div class="tally"><div class="number" id="cpu-tally">0</div><div class="playerName">CPU</div></div></div>   
        `
        ) as Node


        this.callback = null
        this.parentElem.appendChild(gameFragment)
        this.boardElem = DomTools.querySelector(parentElem, ".board")
        this.backButton = DomTools.querySelector(parentElem,".go-back")
        this.parentElem = parentElem
        this.playerGamesWon = 0
        this.cpuGamesWon = 0
        this.playerCounterElem = DomTools.getById("player-tally")
        this.cpuCounterElem = DomTools.getById("cpu-tally")
        this.resetMatch()
    }

    onGameReset(callback : Function) : void {
        this.callback = callback
    }

    private gameResetButtonClicked() {
        this.stopGame(true)
        if(this.callback)
            this.callback();
    }

    startGame(playerTeam:Team){
        this.playerTeam = playerTeam;

        this.checkForCpu();

        //DOM logic
        this.backButton.addEventListener("click", () => {
            this.gameResetButtonClicked()
        })
        DomTools.addEventListener(this.getCells(), "click", this.onCellClick(this))
        DomTools.addClass(this.getCells(), "available")
    }

    stopGame(clearScore:boolean){
        this.resetMatch()
        clearTimeout(this.aiCallback)
        clearTimeout(this.animTimeout)

        let popupElem = DomTools.querySelector(this.boardElem, ".end-game-msg")
        if(popupElem) this.boardElem.removeChild(popupElem)

        if(clearScore) this.clearScore()
        DomTools.recreateNode(this.getCells(), false)
        DomTools.clear(this.getCells())
        let cells = this.getCells();
        DomTools.removeClass(cells, "available")
        DomTools.removeClass(cells, "highlight")
        DomTools.recreateNode(this.backButton,false)
        this.backButton = DomTools.querySelector(this.parentElem,".go-back")
    }

    private clearScore(){
        this.playerGamesWon = 0
        this.cpuGamesWon = 0
        this.printScore()
    }

    private printScore() {
        this.playerCounterElem.textContent = this.playerGamesWon.toString()
        this.cpuCounterElem.textContent = this.cpuGamesWon.toString()
    }

    private getNextAIMove() {
        return new Promise((resolved, failed) =>{
            //Using a setTimeout(..,0) to let the call stack clear before this runs
            this.aiCallback = setTimeout(() => {
                let nextMove = AI.getNextMove(this.board, this.playerTeam, this.getOppositeTeam(this.playerTeam))
                if(typeof nextMove !== 'number')
                    failed("returned Move is not a number")
                else
                    resolved(nextMove)
            }
            ,0)
        })
    }

    private isCPUTurn(){
        return this.currentTurn === this.getOppositeTeam(this.playerTeam)
    }

    private getCells() : NodeListOf<HTMLElement>{
        return DomTools.querySelectorAll(this.boardElem, ".cell")
    }

    private onCellClick(game: TicTacToe) {

        return function(this: HTMLElement){
            let cellN = parseInt(this.dataset.cellId as string)
            game.performTurn(cellN, game.playerTeam)
        }
    }

    private performTurn(cellN:number, team:Team){
        if(!this.IsAvailable(cellN) || !this.isTurn(team))
            return

        this.drawInCell(cellN, team)
        this.fillCell(cellN, team)

        let gameState = this.getGameState(team,cellN)
        
        if(gameState.gameState == GameState.Running){
            this.switchTurn()
            this.checkForCpu()
        }
        else{
            this.playEndGameAnimation(team, gameState)
            .then(()=>{
                this.updateScore(gameState.gameState, team)
                this.stopGame(false)
                this.startGame(this.playerTeam)
            })
        }
    }

    private playEndGameAnimation(lastMoveDoer:Team, gameState: {gameState: GameState, winningLine: [number,number,number] | null}){

        var cellElems: NodeListOf<HTMLElement> | null

        var popupMessage:string = ""
        if(gameState.gameState === GameState.Win)
            if(lastMoveDoer === this.playerTeam)
                popupMessage = "You won! (how, tho'?)"
            else
                popupMessage = "You lost :("
        else
            popupMessage = "It's a tie!"
    
        if(gameState.gameState === GameState.Win && gameState.winningLine){

            let queryString = ""
            for (let i = 0; i < gameState.winningLine.length; i++) {
                const cell = gameState.winningLine[i];
                queryString += `[data-cell-id="${cell}"], `
            }
            queryString = queryString.slice(0,-2)

            cellElems = DomTools.querySelectorAll(this.boardElem, queryString)

            DomTools.addClass(cellElems, "highlight")
        }

        let gameFragment = document.createRange().createContextualFragment(
            `
            <div class="ui-block popup end-game-msg"><p>${popupMessage}</p></div>  
        `
        ) as Node

        this.boardElem.appendChild(gameFragment)
        let popupElem = DomTools.querySelector(this.boardElem, ".end-game-msg")
        
        return new Promise((resolve, fail) => {
            this.animTimeout = setTimeout(() => {
                resolve()
            }, 1000);
        })
    }

    private updateScore(gameState: GameState, team:Team){
        if(gameState === GameState.Win){
            if(team === this.playerTeam)
                this.playerGamesWon++
            else
                this.cpuGamesWon++
            this.printScore()
        }
    }

    private checkForCpu() {
        if(this.isCPUTurn()){
            this.getNextAIMove()
            .then((cell) => {
                this.performTurn(cell as number, this.getOppositeTeam(this.playerTeam))
            })
            .catch((error) =>{
                console.error(error)
            })
        }
    }

    private switchTurn(){
        if(this.currentTurn === Team.Circle)
            this.currentTurn = Team.Cross
        else
            this.currentTurn = Team.Circle
    }

    private getOppositeTeam(team:Team){
        if(team === Team.Circle)
            return Team.Cross
        return Team.Circle
    }

    private isTurn(team:Team){
        return this.currentTurn === team
    }

    private drawInCell(cell:number,team: Team){
        let cellElem = DomTools.querySelector(this.boardElem, `[data-cell-id="${cell}"]`)

        DomTools.removeClass(cellElem, "available");

        let fragmentString = team === Team.Cross ? svgMarkup.cross : svgMarkup.circle
        

        let svgFragment = document.createRange().createContextualFragment(fragmentString) as Node
        cellElem.appendChild(svgFragment)
    }

    //Actual Tic-tac-toe logic
    private resetMatch() {
        this.turnsPassed = 0;
        this.currentTurn = Team.Cross
        this.emptyBoard()
    }

    private emptyBoard() {
        this.board = [null, null, null, null, null, null, null, null, null]
    }

    private IsAvailable(cell:number){
        return this.board[cell] === null
    }

    private fillCell(cell:number, team:Team){
        this.board[cell] = team
        this.turnsPassed++
    }

    private getGameState(team:Team, lastCellNumber:number) : {gameState: GameState, winningLine:[number,number,number]|null}{
        if(this.turnsPassed < 5)
            return {gameState: GameState.Running, winningLine:null}

        let lines:[number,number,number][] = [
            [0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]
        ]
        //get the lines that "lastcellnumber" intercepts
        for(let i = 0; i<lines.length;i++){
            let index = lines[i].indexOf(lastCellNumber)
            let matches = 0;

            if(index > -1){
                //check if the other slots in that line match "team"
                lines[i].forEach(cell => {
                    if(this.getCellState(cell) === team)
                        matches++
                });
                //If so, then "team" won
                if(matches === 3){
                    return {gameState: GameState.Win, winningLine: lines[i]}
                }
            }            
        }
        
        if(this.turnsPassed === 9)
            return {gameState: GameState.Tie, winningLine: null}
        return {gameState: GameState.Running, winningLine: null}
    }

    private getCellState(cell:number) {
        return this.board[cell];
    }
}