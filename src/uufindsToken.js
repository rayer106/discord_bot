import fs from 'fs';
import path from 'path';
import { uufindsConfig } from '../uufindsConfig.js';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 使用 __dirname 构造配置文件的绝对路径
const filePath = path.join(__dirname, '..', 'uufindsConfig.js'); // 假设配置文件在项目根目录

// // 将路径转换为 file:// URL
// const fileURL = `file://${filePath.replace(/\\/g, '/')}`; // 将 Windows 路径转换为正确的格式

// // 读取配置文件
// async function readConfig(fileURL) {
//     if (!fs.existsSync(filePath)) {
//         throw new Error(`文件不存在: ${filePath}`);
//     }
//     const module = await import(fileURL);
//     return module.uufindsConfig;
// }

// 更新 API 密钥计数的逻辑...
function updateApiKeysCount() {
    const currentDate = new Date().toISOString().split('T')[0]; // 获取今天的日期
    const existingDate = uufindsConfig.date;
    let currentKeyValue = null;
    let currentKey = null;

    if (existingDate === currentDate) {
        if (uufindsConfig.keys) {
            const apiKeys = uufindsConfig.keys;

            for (let i = 0; i < apiKeys.length; i++) {
                const key = Object.keys(apiKeys[i])[0];
                const keyValue = apiKeys[i][key]; // 当前key的值
                
                // 如果当前key的值小于等于30
                if (keyValue < 30) {
                    apiKeys[i][key] += 1; // 当前的值加1
                    currentKeyValue = apiKeys[i][key]; // 更新当前计数值
                    currentKey = key; // 记录当前key
                    break; // 找到可加的key后，结束循环
                }
            }

            if(!currentKey || !currentKeyValue) {
                throw new Error('所有Token都已用完,请联系管理员');
            }

            return { "key":currentKey, "value":currentKeyValue }; // 返回当前key和对应值
        } else {
            throw new Error('配置文件出错,没有找到keys字段。');
        }
    } else {
        // 日期不一致，处理逻辑...
        uufindsConfig.date = currentDate;
        const apiKeys = uufindsConfig.keys || [];
        
        // 重置并初始化...
        for (let i = 0; i < apiKeys.length; i++) {
            const key = Object.keys(apiKeys[i])[0];
            apiKeys[i][key] = 0; // 重置计数
        }

        if (apiKeys[0]) {
            apiKeys[0][Object.keys(apiKeys[0])[0]] += 1; // 第一个计数加1
            currentKeyValue = apiKeys[0][Object.keys(apiKeys[0])[0]];
            return { "key": Object.keys(apiKeys[0])[0], "value": currentKeyValue }; // 返回第一个key和计数值
        } else {
            //这里一般不会出错，除非是写文件时导致文件内容出错了
            throw new Error('`配置文件出错, API密钥为空');
        }
    }
}

// 写入更新后的配置文件
function writeConfig() {
    const data = `export const uufindsConfig = ${JSON.stringify(uufindsConfig, null, 4)};`;
    fs.writeFileSync(filePath, data, 'utf-8');
}

export function getUUFindsToken() {
    try {
        //const config = await readConfig(fileURL); // 从根目录读取配置文件
        //console.log("配置内容:", config); // 输出配置内容
        console.log("配置内容1:", uufindsConfig); // 输出配置内容
        const config = updateApiKeysCount();
        writeConfig();
        return config;
    } catch (error) {
        console.error("UUFindsToken错误:", error.message);
        return null;
    }
}