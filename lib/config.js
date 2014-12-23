var config = {};

switch (process.env.ENV) {
  case 'dev':
    config.baseDomain = 'http://localhost:8080';
    config.superUserName = 'ABC123';
    config.superUserPass = 'ABC123';
    break;
  case 'prod':
    config.baseDomain = 'http://localhost:8080';
    config.superUserName = 'ABC123';
    config.superUserPass = 'ABC123';
    break;
  default:
    config.baseDomain = 'http://localhost:8080';
    config.superUserName = 'ABC123';
    config.superUserPass = 'ABC123';
}
  
module.exports = config;