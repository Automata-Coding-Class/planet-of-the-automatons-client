const logger = require('./src/logger');
const { chooseRandomItem } = require('./src/utils');
const cardinalPoints = ['up', 'right', 'down', 'left'];

function determineMove() {
  return chooseRandomItem(cardinalPoints);
}

module.exports = {
  determineMove: determineMove
};
