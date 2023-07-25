const base = require('./base.config');

base.appId = 'com.me.buffed.desktop.preview';
base.productName = 'Buffed Desktop Preview';
base.extraMetadata.name = 'buffed-client-preview';
base.win.extraFiles.push({
  from: 'scripts/debug-launcher.bat',
  to: 'Buffed Desktop Preview Debug Mode.bat',
});
base.win.executableName = 'Buffed OBS Preview';

module.exports = base;
