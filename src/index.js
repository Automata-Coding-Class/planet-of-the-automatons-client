require('dotenv').config();
const fs = require('fs');
const path = require('path');
const logger = require('./logger.js');
const {prompt} = require('inquirer');
const authenticate = require('./authentication').authenticate;
const createSocketManager = require('./socket-connections/socket-manager');

// require(path.join(path.dirname(require.main.filename), '../package.json')).name ||

logger.debug(`process ${process.pid} launched. NODE_ENV = ${process.env.NODE_ENV}`);

function saveEnvironmentVariables(userResponses) {
  // determine if the .env file already exists
  const envFilePath = path.join(__dirname, '../.env');
  const envData = {};
  if (fs.existsSync(envFilePath)) {
    const envfile = require('envfile');
    Object.assign(envData, envfile.parseFileSync(envFilePath));
  }
  envData.DEFAULT_HOSTNAME = userResponses.serverAddress;
  envData.DEFAULT_PORT = userResponses.serverPort;
  // setting allowMultipleInstances to true is intended for development purposes,
  // so that individual user data will not collide
  let allowMultipleInstances = false;
  try {
    allowMultipleInstances = Boolean(JSON.parse(envData['ALLOW_MULTIPLE_INSTANCES']));
  } catch {
    // do nothing; JSON error is taken implicitly as equivalent to "allowMultipleInstance = false"
  } finally {
    logger.debug(`envData.ALLOW_MULTIPLE_INSTANCES: ${allowMultipleInstances} (${typeof allowMultipleInstances})`);
    if (!allowMultipleInstances) {
      envData.DEFAULT_USERNAME = userResponses.username;
    } else {
      delete envData.DEFAULT_USERNAME;
    }
  }
  if (envData.PROCESS_NAME === undefined) {
    envData.PROCESS_NAME = process.env.APP_NAME;
  }
  // if it does, parse it
  // if it does not, create a container object
  // populate the container / reconciling differences between the new input and old
  // write the file to disk
  fs.writeFileSync(envFilePath, Object.entries(envData).reduce((envStr, entry) => {
    envStr += `${entry[0]}=${entry[1]}\n`;
    return envStr;
  }, ''));
}

const run = async () => {
  showStartMenu()
    .then(() => {
        return showConnectionMenu();
      },
      () => {
        quit();
        return Promise.reject('exiting');
      })
    .then(connectionAnswers => {
      logger.debug(`answers: %o`, connectionAnswers);
      return showLoginMenu()
        .then(loginAnswers => {
          return Object.assign({}, connectionAnswers, loginAnswers);
        });
    })
    .then(collatedAnswers => {
      logger.debug(`collatedAnswers: %o`, collatedAnswers);
      saveEnvironmentVariables(collatedAnswers);
      return authenticate(collatedAnswers)
        .then(loginResponse => {
          return Object.assign({}, loginResponse, collatedAnswers);
        })
    })
    .then(data => {
      logger.debug(`login response: %o`, data);
      const socketManager = createSocketManager(`http://${data.serverAddress}:${data.serverPort}`);
      return socketManager.openAllConnections(data.token)
        .then(() => {
          return socketManager;
        })
    })
    .then(response => {
      logger.debug(`connected`);
      console.log('connected.\bPress ^C (control-C) to quit');
    }, reason => logger.error(`reason: %s`, reason.message))
}

function showStartMenu() {
  const startMenu = {
    type: 'rawlist',
    name: 'start',
    message: 'What do you want to do?',
    choices: [
      {name: 'Connect to the server', short: 'connect'},
      {name: 'Quit', short: 'quit'}
    ]
  };
  return prompt(startMenu)
    .then(answers => {
      if (answers.start[0].toLowerCase() === 'c') {
        return true;
      } else {
        throw new Error('quitting');
      }
    });
}

function showConnectionMenu() {
  return prompt({
    type: 'input',
    name: 'serverAddress',
    message: `what is the server's network address? [currently '${process.env.DEFAULT_HOSTNAME}']`,
    default: process.env.DEFAULT_HOSTNAME
  })
    .then(answers => {
      if (!answers.serverAddress) {
        answers.serverAddress = process.env.DEFAULT_HOSTNAME;
      }
      return answers;
    })
    .then(serverAnswers => {
      return prompt({
        type: 'input',
        name: 'serverPort',
        message: `what port is the server running on? [currently '${process.env.DEFAULT_PORT}']`,
        default: process.env.DEFAULT_PORT
      }).then(portAnswers => {
        Object.assign(serverAnswers, portAnswers);
        return serverAnswers;
      })
    })
}

function showLoginMenu() {
  const loginMenu = {
    type: 'input',
    name: 'username',
    message: ('what nickname would you like to use?') + ' (letters and numbers only, start with a letter, between 3 and 32 characters)'
  };
  if (process.env.DEFAULT_USERNAME !== undefined) {
    loginMenu.default = process.env.DEFAULT_USERNAME;
  }
  return prompt(loginMenu)
    .then(answers => {
      if (!/^[a-z0-9]{3,32}$/i.test(answers.username)) {
        throw new Error('not a valid username. please try again.');
      } else {
        return answers;
      }
    });
}

function showMainMenu(socket) {
  const mainMenu = {
    type: 'rawlist',
    name: 'cmd',
    message: 'what would you like to do?',
    choices: [
      {name: 'Send a message', value: 'm'},
      {name: 'Close connection and quit', value: 'q'}
    ]
  };
  prompt(mainMenu)
    .then(answers => {
      logger.info(`user chose option ${answers.cmd}`);
      switch (answers.cmd.length > 0 ? answers.cmd[0].toLowerCase() : '') {
        case 'm':
          sendMessageFromPrompt(socket);
          break;
        case 'q':
          quit(socket);
          break;
      }
    })
}

function sendMessageFromPrompt(socket) {
  logger.info('displaying message input prompt');
  prompt({
    type: 'input',
    name: 'userMessage',
    message: 'what would you like to say?'
  })
    .then(answers => {
      logger.info(`user entered '${answers.userMessage}'`);
      socket.emit('message', answers.userMessage);
    })
    .then(() => {
      showMainMenu(socket);
    })
}

function closeConnection(socket) {
  if (socket) {
    logger.info(`disconnecting from host`);
    socket.close();
  }
}

function quit(socket) {
  logger.info(`exiting process ${process.pid}`);
  closeConnection(socket);
  setTimeout(() => {
    process.exit();
  }, 250);
}

run()
  .then(() => {
    logger.debug(`run loop completed`);
  });

module.exports = {
  authenticate: authenticate,
  showStartMenu: showStartMenu,
}
