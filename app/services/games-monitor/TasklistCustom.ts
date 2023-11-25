// 'use strict';
import childProcess from 'child_process';

// @ts-ignore
import pify from 'pify';
// @ts-ignore
import neatCsv from 'neat-csv';
// const sec = require('sec');
import util from 'util';
const exec = util.promisify(require('child_process').exec);

interface TaskInfo {
  Id: string;
  Path: string;
}

export async function checkIfExists(pid: string): Promise<boolean> {
  if (process.platform !== 'win32') {
    return Promise.reject(new Error('Windows only'));
  }

  try {
    console.log(`Check PID >${pid}<`);
    return await performAsyncOperationWithTimeout(4000, async () => {
      const { stdout } = await exec(`tasklist /FI "PID eq ${pid}"`);
      const isProcessRunning = !stdout.startsWith('INFO');

      console.log('CHECKED.');
      console.log(isProcessRunning);
      return isProcessRunning;
    });
  } catch (error) {
    console.log('ERROR:', error);
    throw error;
  }
}

// Function to perform async operation with a timeout
function performAsyncOperationWithTimeout<T>(
  timeout: number,
  asyncOperation: () => Promise<T>,
): Promise<T> {
  const asyncOperationPromise = asyncOperation();

  // Promise that resolves after the specified timeout
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout} milliseconds`));
    }, timeout);
  });

  // Use Promise.race to race the async operation and the timeout
  return Promise.race([asyncOperationPromise, timeoutPromise]);
}

export async function getTasklist(): Promise<TaskInfo[]> {
  if (process.platform !== 'win32') {
    return Promise.reject(new Error('Windows only'));
  }

  const headers = ['Id', 'Path'];

  const command =
    'Get-Process | Select-Object -Property Id,Path | ConvertTo-Csv -NoTypeInformation | Out-Host';

  try {
    console.log('check tasklist...');
    const out = await pify(childProcess.execFile)('powershell.exe', [
      '-Command',
      command,
    ]).then((stdout: any) => (stdout.startsWith('INFO:') ? [] : neatCsv(stdout, { headers })));

    console.log('CHECKED.');
    console.log(out);

    return out as TaskInfo[];
  } catch (error) {
    console.log('ERROR:', error);
    throw error;
  }

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
