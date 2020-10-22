
//scopePolyfill
import * as ScopePolyFill from "./scopePolyfill";
ScopePolyFill.scopePolyfill()

import{Team} from "./consts"
import{StartMenu} from "./startMenu"
import { TicTacToe } from "./game";
import { DomTools } from "./domTools";
import '../scss/styles.scss'

let gameElem = DomTools.getById("app")

let game = new TicTacToe(gameElem)
let startMenu = new StartMenu(gameElem)

startMenu.onGameStart((choice: Team) => {
    game.startGame(choice)
})
game.onGameReset(() => {
    startMenu.show()
})