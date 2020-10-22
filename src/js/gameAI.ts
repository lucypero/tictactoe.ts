//AI script taken and refactored from: https://github.com/ahmadabdolsaheb/minimaxarticle/blob/master/index.js

import { Team } from "./consts";

export var AI = { getNextMove: getNextMove}

function getNextMove(board : (Team|null)[], playerTeam: Team, cpuTeam: Team) : number{
    
    //Converting the board from my game's format to the AI's format so it can understand it
    let cBoard = convertBoard(board);

    //Converting Team format
    let cPlayerTeam = convertTeam(playerTeam)
    let cCPUTeam = convertTeam(cpuTeam)

    //The AI freezes up for a bit if the board is empty, so it returns a random position in that case
    if(isBoardEmpty(board))
        return Math.floor(Math.random() * Math.floor(9));
    
    let nextMove = minimax(cBoard, cCPUTeam, cPlayerTeam, cCPUTeam) as {index:number, score:number}

    return nextMove.index;
}

function isBoardEmpty(board : (Team|null)[]){
    return board.filter(a => a !== null).length === 0
}

function convertTeam(team:Team):string{
    if(team === Team.Circle)
        return "O"
    return "X"
}

function convertBoard(board : (Team|null)[]) : (string|number)[]{
    return board.map((val,index) => {
        switch(val){
            case Team.Circle: return "O";
            case Team.Cross: return "X"
            case null: return index
        }
    })
}

// the main minimax function
function minimax(newBoard : (string|number)[], player: string, huPlayer: string, aiPlayer:string): {score:number} | {index:number, score:number}{
  
  //available spots
  var availSpots = emptyIndexies(newBoard);

  // checks for the terminal states such as win, lose, and tie and returning a value accordingly
  if (winning(newBoard, huPlayer)){
     return {score:-10};
  }
	else if (winning(newBoard, aiPlayer)){
    return {score:10};
	}
  else if (availSpots.length === 0){
  	return {score:0};
  }

// an array to collect all the objects
  var moves:{index:number, score:number}[] = [];

  // loop through available spots
  for (var i = 0; i < availSpots.length; i++){
    //create an object for each and store the index of that spot that was stored as a number in the object's index key
    var move:{index:number, score:number} = {index:1,score:1};
  	move.index = newBoard[availSpots[i]] as number;

    // set the empty spot to the current player
    newBoard[availSpots[i]] = player;

    //if collect the score resulted from calling minimax on the opponent of the current player
    var result:{score:number}
    if (player == aiPlayer){
      result = minimax(newBoard, huPlayer, huPlayer, aiPlayer) as {score:number};
      move.score = result.score;
    }
    else{
      result = minimax(newBoard, aiPlayer, huPlayer, aiPlayer) as {score:number};
      move.score = result.score;
    }

    //reset the spot to empty
    newBoard[availSpots[i]] = move.index;

    // push the object to the array
    moves.push(move);
  }

// if it is the computer's turn loop over the moves and choose the move with the highest score
  var bestMove:number = 0
  if(player === aiPlayer){
    var bestScore = -10000;
    for(var i = 0; i < moves.length; i++){
      if(moves[i].score > bestScore){
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }else{
// else loop over the moves and choose the move with the lowest score
    var bestScore = 10000;
    for(var i = 0; i < moves.length; i++){
      if(moves[i].score < bestScore){
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }
// return the chosen move (object) from the array to the higher depth
  return moves[bestMove];
}

// returns the available spots on the board
function emptyIndexies(board:(string|number)[]) : number[]{
    return board.filter(s => s != "O" && s != "X") as number[];
}

// winning combinations using the board indexies for instace the first win could be 3 xes in a row
function winning(board:(string|number)[], player:string){
 if (
        (board[0] == player && board[1] == player && board[2] == player) ||
        (board[3] == player && board[4] == player && board[5] == player) ||
        (board[6] == player && board[7] == player && board[8] == player) ||
        (board[0] == player && board[3] == player && board[6] == player) ||
        (board[1] == player && board[4] == player && board[7] == player) ||
        (board[2] == player && board[5] == player && board[8] == player) ||
        (board[0] == player && board[4] == player && board[8] == player) ||
        (board[2] == player && board[4] == player && board[6] == player)
        ) {
        return true;
    } else {
        return false;
    }
}