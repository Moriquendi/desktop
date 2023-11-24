// 'use strict';
import childProcess from 'child_process';

// @ts-ignore
import pify from 'pify';
// @ts-ignore
import neatCsv from 'neat-csv';
// const sec = require('sec');

export function getTasklist() {
  //   spawn('powershell.exe', ['C:\\folder\\folder2\\myPSScript.ps1']);
  if (process.platform !== 'win32') {
    return Promise.reject(new Error('Windows only'));
  }

  const headers = ['Id', 'Path'];

  const out = pify(childProcess.execFile)(
    'powershell.exe',
    'Get-Process | Select-Object -Property Id,Path | ConvertTo-Csv -NoTypeInformation | Out-Host',
  ).then((stdout: any) => (stdout.startsWith('INFO:') ? [] : neatCsv(stdout, { headers })));

  console.log(out);
  return out;

  //module.exports = opts => {

  //   opts = opts || {};

  //   const args = ['/nh', '/fo', 'csv'];

  //   if (opts.verbose) {
  //     args.push('/v');
  //   }

  //   if (opts.system && opts.username && opts.password) {
  //     args.push('/s', opts.system, '/u', opts.username, '/p', opts.password);
  //   }

  //   if (Array.isArray(opts.filter)) {
  //     for (const filter of opts.filter) {
  //       args.push('/fi', filter);
  //     }
  //   }

  //   const defaultHeaders = ['imageName', 'pid', 'sessionName', 'sessionNumber', 'memUsage'];

  //   const verboseHeaders = defaultHeaders.concat(['status', 'username', 'cpuTime', 'windowTitle']);

  //   const headers = opts.verbose ? verboseHeaders : defaultHeaders;

  //   return (
  //     pify(childProcess.execFile)('tasklist', args)
  //       // `INFO:` means no matching tasks. See #9.
  //       .then(stdout => (stdout.startsWith('INFO:') ? [] : neatCsv(stdout, { headers })))
  //       .then(data =>
  //         data.map(task => {
  //           // Normalize task props
  //           task.pid = Number(task.pid);
  //           task.sessionNumber = Number(task.sessionNumber);
  //           task.memUsage = Number(task.memUsage.replace(/[^\d]/g, '')) * 1024;

  //           if (opts.verbose) {
  //             task.cpuTime = sec(task.cpuTime);
  //           }

  //           return task;
  //         }),
  //       )
  //   );
}
