/**
 * @file 命令行功能模块
 * @author ielgnaw(wuji0223@gmail.com)
 */

import {createReadStream,existsSync,statSync} from 'fs';
import {resolve} from 'path';
import chalk from 'chalk';
import {log} from 'edp-core';
import sys from '../package';
import {formatMsg, getCandidates, uniqueMsg} from './util';
import {check} from './checker';
import {exec} from 'child_process';
import async from 'async';

'use strict';

/**
 * 显示默认的信息
 */
function showDefaultInfo() {
    console.log();
    console.log((sys.name + ' v' + sys.version));
    console.log(chalk.bold.green(formatMsg(sys.description)));
    console.log();
    console.log('Usage');
    console.log();
    console.log('Show default info');
    console.log(chalk.white.bold('  $ ire'));
    console.log();
    console.log('Initialize react-native development environment in dirPath');
    // console.log('under dirpath catalog, initialize react-native exploitation environment.');
    console.log(chalk.white.bold('  $ ire dirPath'));
}

/**
 * 获取当前系统的 npm registry 以及 disturl 配置
 *
 * @return {Promise} promise 对象
 */
function getNpmConfig() {
    return new Promise((resolve, reject) => {
        async.parallel([
            (cb) => {
                exec('npm config get registry', (e, stdout, stderr) => {
                    cb(e, stdout.replace(/\n*$/, ''));
                });
            },
            (cb) => {
                exec('npm config get disturl', (e, stdout, stderr) => {
                    cb(e, stdout.replace(/\n*$/, ''));
                });
            }
        ], (err, results) => {
            if (err) {
                return reject(err);
            }
            return resolve(results);
        });
    });
}

function runVerbose(root, projectName, rnPackage) {
  var proc = spawn('npm', ['install', '--verbose', '--save', getInstallPackage(rnPackage)], {stdio: 'inherit'});
  proc.on('close', function (code) {
    if (code !== 0) {
      console.error('`npm install --save react-native` failed');
      return;
    }

    cli = require(CLI_MODULE_PATH());
    cli.init(root, projectName);
  });
}

/**
 * 解析参数。作为命令行执行的入口
 *
 * @param {Array} args 参数列表
 */
function parse(args) {
    args = args.slice(2);

    if (args.length === 0) {
        showDefaultInfo();
        return;
    }

    // 只取第一个参数
    let folderName = args[0];

    let absolutePath = resolve(process.cwd(), folderName);

    let shouldCreate = false;
    let stat;
    try {
        stat = statSync(absolutePath);
        if (!stat.isDirectory()) {
            shouldCreate = true;
        }
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            shouldCreate = true;
        }
    }

    if (!shouldCreate) {
        console.warn(`The folder ${chalk.bold.red(folderName)} is already exist, Please change the folder name.`);
        return;
    }

    // 缓存默认的 npm config registry 以及 npm disturl 初始化环境后恢复
    let npmRegistryOriginal;
    let npmDisturlOriginal;

    getNpmConfig().then((ret) => {
        npmRegistryOriginal = ret[0];
        npmDisturlOriginal = ret[1];
        console.warn(npmRegistryOriginal, npmDisturlOriginal);
    }, (err) => {
        console.warn('err', err);
        process.exit(1);
    });
}

export {parse};