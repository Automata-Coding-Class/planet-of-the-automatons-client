const createCoreSocketConnection = require('./core-socket-connection');
const playerBot = require('../../bot');
const logger = require('../logger');

module.exports = function createEventConnection(serverAddress) {
  const namespace = 'event';
  const coreConnection = createCoreSocketConnection(serverAddress);

  let socket;
  let paused = false;
  let pendingFrame = undefined;

  const createConnection = async (authToken) => {
    socket = await coreConnection.createConnection(namespace, authToken);
    addSocketEvents(socket);
  };

  function processFrameAndRespond(socket, frame) {
    const response = playerBot.determineMove(frame);
    let processedResponse;
    if(typeof response  === 'string') {
      processedResponse = {action: {type: 'move', direction: response}};
    } else if(response !== undefined && response.type !== undefined) {
      processedResponse = {action: Object.assign({}, response)};
    }
    logger.debug(`responding to frame id '${frame.frameId}' with ${JSON.stringify(response)}`);
    socket.emit('frameResponse', {frameId: frame.frameId, response: processedResponse});
  }

  function initializeGameState() {
    paused = false;
    pendingFrame = undefined;
  }

  const addSocketEvents = (socket) => {
    socket.on('newGameCreated', gameParameters => {
      logger.debug('newGameCreated: %s', gameParameters);
      initializeGameState();
      coreConnection.dispatchEvent('newGameCreated', gameParameters);
    });
    socket.on('newFrame', frame => {
      logger.debug(`received a new frame: %o`, frame);
      if(frame.data === undefined) {
        socket.emit('frameResponse', {frameId: frame.frameId});
      } else if(paused) {
        logger.debug(`paused, will not process frame`);
        pendingFrame = frame;
      } else {
        processFrameAndRespond(socket, frame);
      }
    });
    socket.on('gamePaused', () => {
      logger.debug(`game paused`);
      paused = true;
    });
    socket.on('gameResumed', () => {
      logger.debug(`game resumed`);
      paused = false;
      if(pendingFrame !== undefined) {
        processFrameAndRespond(socket, pendingFrame);
        pendingFrame = undefined;
      }
    });
    socket.on('gameStopped', () => {
      logger.debug(`game stopped`);
      paused = false;
      if(pendingFrame !== undefined) {
        processFrameAndRespond(socket, pendingFrame);
        pendingFrame = undefined;
      }
    })
  };

  return {
    objectName: 'StateMachineConnection',
    createConnection: createConnection,
    disconnect: coreConnection.disconnect,
    ping: coreConnection.ping,
    on: coreConnection.on
  };
}
