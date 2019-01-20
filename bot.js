// any line that starts with two forward slashes is a 'comment', and basically ignored by the program
// you can use comments to leave notes for yourself or other coders working on the same project

// you don't to worry too much about the next three lines
// they're defining things that the program uses (or will use)
// further down... DON'T DELETE THEM! though
const logger = require('./src/logger');
const { chooseRandomItem } = require('./src/utils');

const cardinalPoints = ['up', 'right', 'down', 'left'];

// this is where the significant work of the program is done
// doesn't do much (of use) yet, though, huh?
// all this bot does at the moment is to randomly choose
// one of the four directions from the list above
// it certainly moves the player around, but it's really 
// not a great strategy
function determineMove() {
  
  return chooseRandomItem(cardinalPoints);
}

// you don't have to worry too much about this line, either. 
// the 'exports' part probably gives you a clue, this is where 
// the code in this file gets exported so that other parts 
// of the program can use it.
// DON'T DELETE THIS! either
module.exports = {
  determineMove: determineMove
};
