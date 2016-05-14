/**
 * @file 命令行功能模块
 * @author ielgnaw(wuji0223@gmail.com)
 */

import {statSync} from 'fs';
import {resolve} from 'path';
import chalk from 'chalk';
import sys from '../package';
import {formatMsg} from './util';
import {exec,spawn} from 'child_process';
import async from 'async';

'use strict';

const REGISTRY = 'https://registry.npm.taobao.org';
const DISTURL = 'https://npm.taobao.org/dist';

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
                exec('npm config get registry', (e, stdout) => {
                    cb(e, stdout.replace(/\n*$/, ''));
                });
            },
            (cb) => {
                exec('npm config get disturl', (e, stdout) => {
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

/**
 * set npm config registry
 *
 * @param {string} src registry 值
 */
function setNpmRegistry(src) {
    let proc = spawn('npm', ['config', 'set', 'registry', src], {stdio: 'inherit'});
    proc.on('close', (code) => {
        if (code !== 0) {
            console.error(chalk.bold.red('`npm config set registry` failed'));
            process.exit(1);
        }
    });
}

/**
 * set npm config disturl
 *
 * @param {string} src disturl 值
 */
function setNpmDisturl(src) {
    let op = 'set';
    if (!src || src === 'undefined') {
        op = 'delete';
    }

    let proc = spawn('npm', ['config', op, 'disturl', src], {stdio: 'inherit'});
    proc.on('close', (code) => {
        if (code !== 0) {
            console.error(chalk.bold.red('`npm config set disturl` failed'));
            process.exit(1);
        }
    });
}

/**
 * 还原 npm config
 *
 * @param {string} registry registry 值
 * @param {string} disturl disturl 值
 */
function reset(registry, disturl) {
    setNpmRegistry(registry);
    setNpmDisturl(disturl);
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

        process.on('SIGINT', () => {
            reset(npmRegistryOriginal, npmDisturlOriginal);
        });

        async.auto({
            setConfig: (cb) => {
                setNpmRegistry(REGISTRY);
                setNpmDisturl(DISTURL);
                cb(null);
            },
            mkFolder: (cb) => {
                exec(`mkdir ${folderName}`, (e) => {
                    cb(e);
                });
            },
            process: ['setConfig', 'mkFolder', (cb) => {
                let proc = spawn('sh', [resolve(__dirname, 'init.sh'), folderName], {
                    stdio: 'inherit',
                    cwd: absolutePath
                });
                proc.on('close', (code) => {
                    if (code !== 0) {
                        console.error('`run init.sh` failed');
                        cb(code);
                    }
                    else {
                        cb(null);
                    }
                });
            }],
            reset: ['process', (cb) => {
                reset(npmRegistryOriginal, npmDisturlOriginal);
                cb();
            }]
        }, (err) => {
            if (err) {
                reset(npmRegistryOriginal, npmDisturlOriginal);
                return;
            }
        });



    }, (err) => {
        console.warn('err', err);
        process.exit(1);
    });
}

export {parse};