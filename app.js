import { discordServer } from "./src/discordServer.js";
import { uufindsParse } from "./src/uufindsParse.js";
import { EmbedBuilder, ButtonStyle, ButtonBuilder } from 'discord.js';
import _ from 'lodash';
import { getUUFindsToken } from './src/uufindsToken.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const discord = new discordServer();
discord.onWSMessageCreate = async function(message) {
    if(message.channel.name !== 'test') return;

    // const response = await axios.get("https://weidian.com/item.html?itemID=7267596927");
    // //console.log(response.data);return;
    // //fs.writeFileSync('weidian.html', response.data);return;
    // const $ = cheerio.load(response.data);
    // //const data_obj = $('#__rocker-render-inject__').attr('data-obj');
    // const data_obj = JSON.parse($('#__rocker-render-inject__').attr('data-obj'));
    // //fs.writeFileSync('weidian_data_obj_default_model.html', data_obj);
    // const shop_name =data_obj.result.default_model.shop_info.shopName;
    // const shop_url = data_obj.result.default_model.shop_info.shop_url;
    // console.log("shop_name:"+shop_name);
    // console.log("shop_url:"+shop_url);
    // return;

    if (message.content == "ping") {
        await message.reply('pong');
        return;
    }
    
    let uri = null;
    try {
        uri = new URL(message.content);
    } catch (err) {
        //message.reply(err.message);
        return;
    }

    const uufinds = new uufindsParse();
    uufinds.parse(uri, async (_ret) => {
        if(!_ret || !_ret.goods) {
            console.log("parse failed");
            return;
        }
        const msg = goodsMessage(_ret);
        if(_ret.goods.qc_image_list && _ret.goods.qc_image_list.length > 1) {
            for(let i = 1; i < _ret.goods.qc_image_list.length; i++) {                
                await message.reply(_ret.goods.qc_image_list[i]);
            }
        }
        await message.reply(msg);
    });
}

discord.onMessageCreate = async function(interaction) {
    if(message.channel.name !== 'test') return;
    
    if (interaction.commandName === 'test') {
        const testMessage = `> # CNFans Chosen Provider
        > [100%QC, ship in 12 hours](https://cnfans.com/product/?shop_type=weidian&id=7312773200)
        > Price
        > $25.52
        >       
        > CNFans link:
        > [Best quality and affordable goods in CNFans collection](https://cnfans.com/product/?shop_type=weidian&id=7312773200)
        > Weidian link: [Navigate to weidian](https://weidian.com/item.html?itemID=7312773200)
        > 
        > [real goods pic](https://images.pexels.com/photos/1308881/pexels-photo-1308881.jpeg?cs=srgb&dl=pexels-soldiervip-1308881.jpg&fm=jpg)`;

        await interaction.reply(testMessage);
    } else if (interaction.commandName === 'help') {
        const helpMessage = `> **CNFans Bot Commands**
        > 
        > **test** - Test the bot
        > **help** - Show this message`;

        await interaction.reply(helpMessage);
    } else if (interaction.isButton()) {
        // Handle the button click based on the label or custom ID
        switch (interaction.customId) {
            case 'buyOopbuy':
                await interaction.reply('You clicked the button to buy on Oopbuy!');
                break;
            case 'buyCNFans':
                await interaction.reply('You clicked the button to buy on CNFans!');
                break;
            case 'buyAliChinabuy':
                await interaction.reply('You clicked the button to buy on AliChinabuy!');
                break;
            case 'buyHoobuy':
                await interaction.reply('You clicked the button to buy on Hoobuy!');
                break;
            default:
                await interaction.reply('Button not recognized.');
        }
    } else {
        console.log(`Unknown command: ${interaction.commandName}`);
        interaction.reply(`Unknown command: ${interaction.commandName}`);
    }
}

// 图标：用蝙蝠侠的图标
// BatmanQC-Help you find the best
// XXX商品名字，要翻译成英文XXX
// Price
// $XXX (---按照正常汇率把人民币折算成美金)

// Provider Weidian:<微店名字> （---可点击该链接）
// Provider Level:<> （---商家等级）
// Provider Sold:<> （---已售数量）

// QC Photos
// 20 photos available, click to view them
// <商品图片>

function goodsMessage(msg){
    // msg = {
    //     "goods": {
    //         "name": "XXX商品名字，要翻译成英文XXX",
    //         "image": "https://images.pexels.com/photos/1308881/pexels-photo-1308881.jpeg?cs=srgb&dl=pexels-soldiervip-1308881.jpg&fm=jpg",
    //         "price": "$20.25",
    //         "provider_name": "微店名字",
    //         "provider_shop_link": "https://weidian.com/item.html?itemID=商品ID",
    //         "provider_level": "10",
    //         "provider_bought": "10",
    //         "qc_photo_num": "20",
    //         "qc_uufinds_link": "https://uufind.macmillan.com.tw/iii/encore/record/C__I10",
    //         "buy_name": "CNFans",
    //         "buy_link": "https://example.com/buy"
    //     }
    // };
    
    console.log(msg);
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('CNFans: BatmanQC-Help you get QC photos')
        .setDescription(`[${msg.goods.name}](${msg.goods.rawUri})`)
        .addFields(
            { name: '**Price**', value: `$${msg.goods.price}`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'BatmanQC', iconURL: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRq84LL2n1v7fhafIi0coWfzRqsS7ljAuJcBQ&s' });
    if(msg.goods.channel === 'weidian'){
        embed.addFields(
            { name: `  `, value: `  `, inline: false },
            { name: ` `, value: `**Provider ${msg.goods.channel}**: [${msg.goods.provider_name}](${msg.goods.provider_link})`, inline: false },
            { name: ` `, value: `**Provider Level**: ${msg.goods.provider_level}（From 1~99, 99 is the best in Weidian）`, inline: false },
            { name: ` `, value: `**Provider Sold**: ${msg.goods.provider_bought}`, inline: false },
            { name: `  `, value: `  `, inline: false }
        );
    }
    if(msg.goods.qc_photo_num > 0) {
        embed.addFields(
            { name: 'QC Photos', value: `${msg.goods.qc_photo_num} photos available, [click to view them](${msg.goods.qc_uufinds_link})`, inline: false }
        );
        embed.setImage(`${msg.goods.qc_image_list[0]}`);
    } else {
        embed.setImage(`${msg.goods.image}`);
    }
    
    const buttonRow = {
        type: 1,
        components: [
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel(`CNFans: Join BatmanQC to get QC`)
                .setURL('https://discord.gg/nePRQRwGXU')
                //.setLabel(`Buy on ${msg.goods.buy_name}`)
                //.setURL(`${msg.goods.buy_link}`)
                //.setEmoji('🎟️') // Add an emoji here
        ]
    };
    return { embeds: [embed], components: [buttonRow] };
}

discord.connect();


// const buttonRow = {
//     type: 1,
//     components: [
//         new ButtonBuilder()
//             .setStyle(ButtonStyle.Link)
//             .setLabel('Buy on CNFans | $125 coupons for new users!')
//             .setURL('https://example.com/2')
//             .setEmoji('🎟️') // Add an emoji here
//     ]
// };

// new ButtonBuilder()
//     .setStyle(ButtonStyle.Link)
//     .setLabel('Buy on Oopbuy | $210 coupons and 30% shipping OFF!')
//     .setURL('https://example.com/1')
//     .setEmoji('💸'), // Add an emoji here

// new ButtonBuilder()
//     .setStyle(ButtonStyle.Link)
//     .setLabel('Buy on AliChinabuy | $150 coupons for new users!')
//     .setURL('https://example.com/3')
//     .setEmoji('🛒'), // Add an emoji here

// new ButtonBuilder()
//     .setStyle(ButtonStyle.Link)
//     .setLabel('Buy on Hoobuy | Get ¥1000 coupons NOW!')
//     .setURL('https://example.com/4')
//     .setEmoji('🔥') // Add an emoji here

// const replayMessage = `> # CNFans Chosen Provider
// > [100%QC, ship in 12 hours](`+_ret.buyLink+`)
// > Price
// > $`+_ret.goods.uufindsGoodsPrice+`
// >  
// > CNFans link:
// > [Best quality and affordable goods in CNFans collection](`+_ret.buyLink+`)
// > `+_ret.goods.uufindsSource+` link: [Navigate to `+_ret.goods.uufindsSource+`](`+_ret.cnLink+`)
// > 
// > [Navigate to QC goods link](`+_ret.goods.uufindsQCLink+`)
// > [`+_ret.goods.uufindsQCPhotoNum+` QC goods Image](`+_ret.goods.uufindsGoodsImage+`)`; 

// message.reply(replayMessage);