const { notarize } = require('@electron/notarize');
const fs = require('fs');

exports.default = async function notarizing(context) {
  if (process.env.SLOBS_NO_NOTARIZE) return;
  if (process.platform !== 'darwin') return;

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${context.appOutDir}/${appName}.app`;

  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application for notarization at: ${appPath}`);
  }

  console.log(`Notarizing app found at: ${appPath}`);
  console.log('This can take several minutes.');

  console.log(`Appleid: ${process.env['APPLE_ID']}`);
  console.log(`Appleid password: ${process.env['APPLE_APP_PASSWORD']}`);
  console.log(`Appleid asc provider: ${process.env['APPLE_ASC_PROVIDER']}`);

  await notarize({
    appPath,
    tool: 'notarytool',
    appBundleId: 'me.buffed.app.desktop',
    appleId: process.env['APPLE_ID'],
    appleIdPassword: process.env['APPLE_APP_PASSWORD'],
    teamId: process.env['APPLE_ASC_PROVIDER'],
  });

  console.log('Notarization finished.');
};
