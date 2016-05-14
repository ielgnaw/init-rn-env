#!/bin/sh

# 获取命令行参数
function getCommandArgs() {
    if [ $# -ge 1 ]; then
        commandArgs=$@
    else
        echo "\033[31m [ERROR]Please enter the name of the folder that you want to initialize! \033[0m"
        exit 1;
    fi
}

getCommandArgs $@

npm init
npm install --save react-native
node -e "require('react-native/local-cli/cli').init('.','"$commandArgs"')"