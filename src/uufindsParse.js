import axios from 'axios';
import util from 'util';
import * as cheerio from 'cheerio';
import { getUUFindsToken } from './uufindsToken.js';

export class uufindsParse {
    uufindUrl = 'https://api.uufinds.com/goods?pageNo=1&pageSize=10&keyword=%s&rankType=NEW';
    uufindQC = 'https://www.uufinds.com/goodItemDetail/qc/%s';
    weidianTemplate = 'https://weidian.com/item.html?itemID=%s';
    taobaoTemplate = 'https://item.taobao.com/item.htm?id=%s';
    ali1688Template = 'https://detail.1688.com/offer/%s.html';
    //tmallTemplate = 'tmall.com';
    mapCNFansShopType = new Map([
        ['weidian', this.weidianTemplate],
        ['taobao', this.taobaoTemplate],
        ['ali_1688', this.ali1688Template],
        ['tmall', this.mapCNFansShopType],
    ]);
    hostProcessors = {
        'cnfans.com': this.processCNFans.bind(this),
        'joyabuy.com': this.processCNFans.bind(this),
        //'hoobuy.com': this.processHoobuy.bind(this),
        //'oopbuy.com': this.processOopbuy.bind(this),
        // Add more hosts here as necessary
    };
    domesticHostProcessors = {
        'weidian.com': this.processWeidian.bind(this),
        'item.taobao.com': this.processTaobao.bind(this),
        'detail.1688.com': this.processAli1688.bind(this),
        //'tmall.com': this.processTmall.bind(this),
    };
    platformName = {
        'cnfans.com': 'CNFans',
        'joyabuy.com': 'Joyabuy',
        'hoobuy.com': 'Hoobuy',
        'oopbuy.com': 'Oopbuy',
        'weidian.com': 'Weidian',
        'item.taobao.com': 'Taobao',
        'detail.1688.com': 'Ali1688',
        //'tmall.com': 'Tmall',
    };

    // constructor() {
       
    // }

    async parse(rawUri, callback) {
        try {
            const axiosHeader = this.getAxiosConfig();
            const requestUri = this.getUUFindsUri(rawUri);
            console.log("requestUri:", requestUri);
            const response = await axios.get(requestUri, axiosHeader);
            this.handleResponse(response, rawUri, callback);
        } catch (error) {
            console.error('Error fetching the page:', error.message);
        }
    }
    
    getAxiosConfig() {
        const token = getUUFindsToken();
        console.log("token:",token);
        if(!token) {
            throw new Error('UUFinds token is NULL.');
        }
        return {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://cnfans.com/keywords/?query=shoes&num=1&sort=default&f=false',
                'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'Priority': 'u=0, i',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'X-Access-Token': token.key,
            }
        };
    }

    // Generate the URI data based on input
    getUUFindsUri(rawUri) {
        const processor = this.hostProcessors[rawUri.host];
        const domesticProcessor = this.domesticHostProcessors[rawUri.host];
        if (!processor && !domesticProcessor) {
            //console.error(`No processor for host: ${rawUri.host}`);
            //return {};
            throw new Error('No processor for host:'+ rawUri.host);
        }

        let uufindsSearchLink = "";
        if(processor) {
            uufindsSearchLink = processor(rawUri);
        } else {
            uufindsSearchLink = domesticProcessor(rawUri);
        }

        return util.format(this.uufindUrl, encodeURIComponent(uufindsSearchLink));
    }

    // Process requests for CNFans and Joyabuy
    processCNFans(rawUri) {
        const shopType = rawUri.searchParams.get('shop_type');
        const itemId = rawUri.searchParams.get('id');
        
        if (this.mapCNFansShopType.has(shopType) && itemId) {
            return util.format(this.mapCNFansShopType.get(shopType), itemId);
        } else {
            throw new Error(`Invalid shop type or ID for CNFans:shop_type=${shopType}, id=${itemId}`);
        }
    }

    // Placeholder for processing Hoobuy logic
    processHoobuy(rawUri) {
        console.log("Processing logic for hoobuy.com");
        // Implement the logic for hoobuy.com if needed
    }

    // Placeholder for processing Oopbuy logic
    processOopbuy(rawUri) {
        console.log("Processing logic for oopbuy.com");
        // Implement the logic for oopbuy.com if needed
    }

    processWeidian(rawUri) {
        const itemId = rawUri.searchParams.get('itemID');
        if(itemId) {
            return util.format(this.weidianTemplate, itemId);
        } else {
            throw new Error(`Invalid item ID for Weidian:itemID=${itemId}`);
        }
    }

    processTaobao(rawUri) {
        const id = rawUri.searchParams.get('id');
        if(id) {
            return util.format(this.taobaoTemplate, id);
        } else {
            throw new Error(`Invalid ID for Taobao:id=${id}`);
        }
    }

    processAli1688(rawUri) {        
        const match = rawUri.href.match(/offer\/(\d+)\.html/);
        if (match) {
            const id = match[1];
            if(id) {
                return util.format(this.ali1688Template, id);
            } else {
                throw new Error(`Invalid ID for 1688:id=${id}`);
            }
        } else {
            throw new Error(`Invalid ID for 1688: regex not match`);
        }
    }

    processTmall(rawUri) {
    }

    async handleResponse(response, rawUri, callback) {
        const goodsData = this.extractGoodsData(response);
        console.log(goodsData);
        if (goodsData) {
            const data = await this.populateResultWithGoodsData(rawUri, goodsData);
            callback(data);
        } else {
            console.error('Response is missing result or records.');
        }
    }
    
    // Extract goods data from the response
    extractGoodsData(response) {
        const records = response.data?.result?.records;
        return records?.length ? records[0] : null; // Return the first goods record or null
    }
    
    // Populate the result object with goods data
    async populateResultWithGoodsData(rawUri, goodsData) {
        const goods= {
            "name": goodsData.subject,
            "image": goodsData.majorImg,
            "rawUri": rawUri.href,
            "price": goodsData.price,
            "channel": goodsData.channel,
            "sourceLink": goodsData.sourceLink,
            "provider_bought": goodsData.saleVolume,//如果是其他微店商品，则是这个商品的实际销量，如果是自己的商品，则加上5000
            "qc_photo_num": goodsData.qcImgQuantity,//商品qc图片的数量
            "qc_uufinds_link": util.format(this.uufindQC, goodsData.id),//uufinds的链接
            "qc_image_list": goodsData.qcImageList,
        }
        goods.buy_name = this.platformName[rawUri.host];//供应商的名称，cnfans或者其他
        goods.buy_link = rawUri.href;//供应商的购买链接

        if(goodsData.channel === 'weidian') {
            //获取这个商品的店铺名称，如果店铺名称是我们的
            const _weidian = await axios.get(goodsData.sourceLink);
            try {
                const $ = cheerio.load(_weidian.data);
                const data_obj = JSON.parse($('#__rocker-render-inject__').attr('data-obj'));
                if(!data_obj) {
                    console.error('Weidian数据结构变化, data_obj is null');
                    return null;
                }
            } catch (error) {
                console.error('Weidian数据结构变化, 解析失败', error);
                return null;
            }
            const shop_id = data_obj.result.default_model.shop_info.shop_id;
            const shop_name =data_obj.result.default_model.shop_info.shopName;
            const shop_url = data_obj.result.default_model.shop_info.shop_url;
            const shop_credit = data_obj.result.default_model.shop_info.shop_credit;
            let shop_level = shop_credit.credit_type*5 + shop_credit.credit_num;

            if(shop_id === '1642209973' || shop_id === '1645796533') {
                goods.provider_bought += 5000;//+ Math.floor(Math.random() * 1000)
                shop_level = 99;
            }

            goods.provider_name = shop_name;//"国内平台商家店铺名称"
            goods.provider_link = shop_url;//"国内平台商家店铺主页"
            goods.provider_level = shop_level;//"国内平台商家店铺等级"
        }

        return {goods};
    }
}

// {
//     id: '1853614322527830018',
//     subject: 'JTrvisSctt系列合集',
//     majorImg: 'https://img.uufinds.com/product/2024/11
//   /29/1862406593221595138/major/2c9280829376c65d019377
//   1c79b12183.webp',
//     price: 62.235,
//     spuNo: '7234119482',
//     channel: 'weidian',
//     sourceLink: 'https://weidian.com/item.html?itemID=
//   7234119482',
//     saleVolume: 2,
//     searchVolume: 2,
//     qcImgAlbumQuantity: 2,
//     qcImgQuantity: 10,
//     lastProductUser: 'Oopbuy',
//     lastProductUserInfo: {
//       id: '1816002471883505669',
//       userName: 'Oopbuy',
//       nickname: 'Oopbuy',
//       avatar: 'https://api.uufinds.com/sys/common/stat
//   ic/custom/oopbuy1x_1727424538340.png',
//       agentLogo: null
//     },
//     lastProductTime: '2024-11-29 16:01:48',
//     qcImageList: [
//       'https://img.uufinds.com/product/2024/11/29/1862
//   406593221595138/qc/2c9280829376c65d0193771c8b272190.
//   webp',
//       'https://img.uufinds.com/product/2024/11/29/1862
//   406593221595138/qc/2c9280829376c65d0193771c8ea22191.
//   webp',
//       'https://img.uufinds.com/product/2024/11/29/1862
//   406593221595138/qc/2c9280829376c65d0193771c92952192.
//   webp',
//       'https://img.uufinds.com/product/2024/11/29/1862
//   406593221595138/qc/2c9280829376c65d0193771c97a32193.
//   webp',
//       'https://img.uufinds.com/product/2024/11/29/1862
//   406593221595138/qc/2c9280829376c65d0193771c9c7a2194.
//   webp',
//       'https://img.uufinds.com/product/2024/11/29/1862
//   406593221595138/qc/2c9280829376c65d0193771ca19e2195.
//   webp'
//     ]
//   }
  

// import axios from 'axios';
// import _ from 'lodash';
// import util from 'util';

// export class uufindsParse {
//     //这个链接是用来查询商品的
//     uufindUrl = 'https://api.uufinds.com/goods?pageNo=1&pageSize=10&keyword=%s&rankType=NEW';
//     //这个页面是uufinds的QC落地页
//     uufindQC = 'https://www.uufinds.com/goodItemDetail/qc/%s';
//     // async parse(message) {
//     //     try {
//     //         const $ = await cheerio.fromURL(message);
//     //         console.log($);
//     //     } catch(err) {
//     //         console.log(err.message);
//     //     }
//     //'https://api.uufinds.com/goods?pageNo=1&pageSize=10&imageUrl=&keyword=https:%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7267596927&rankType=NEW&selectId=&largeCategoryCode=&middleCategoryCode='
//     async parse(uri, fn) {
//         let _result = this.getUUFindsUri(uri);
//         //console.log("start parse:"+_uri);
//         axios.get(_result.uufindsApiLink, {
//             headers: {
//               'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
//               'Accept-Language': 'en-US,en;q=0.5',
//               'Referer':'https://cnfans.com/keywords/?query=shoes&num=1&sort=default&f=false',
//               'Sec-Ch-Ua':'"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
//               'Priority':'u=0, i',
//               'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
//               'X-Access-Token':'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MzM0MzcwNTAsInVzZXJuYW1lIjoic29tZW9uZTEzMTkifQ.FDyIoxKg9mTVQ0DbCfOlAaCvpbJGBJohNqjoJ2LVty4'
//               //'Cookies':'lf_session_id=1b2b72fe-af69-4bcf-a924-09df7599caf6; lf_first_visit=1731579409242; _ss_s_uid=96ad215d3a86c4cc0ee04f42c302a8a0; _tt_enable_cookie=1; _ttp=eajr4HxHKXZrl4FHQHWlnRU-3-N.tt.1; _hjSessionUser_3640651=eyJpZCI6IjVjYzU5MzQ0LTJlYmItNTg0OS04MDQ0LWI1ZTAxNGY3OGRhNyIsImNyZWF0ZWQiOjE3MzE2NTIxOTAyNzcsImV4aXN0aW5nIjp0cnVlfQ==; pll_language=en; agree-risk=false; cna=oi3LH8/OlG0BASQJijQOZL6j; isg=BEVFsDtMjoDUQqovsk6OuKxkVIF_AvmUJapljEeqjHyA3mVQD1HKZNr97AIonhFM; tfstk=fWWStOmxL40WJ4Pz1DE2lW2FeP9Q7wwZRDtdjMHrvLpJR6_1RBkPvzbCdEQla0kyUBKCvEbBtuYeJe_Fv_r4QRSlqpvpRPyaQ7A2pNWWJ2JdnHluXPzaQ-unSzxa7azdUngXxEK-eQpLc-KMXpK-epEXkHti94QdJiEXjHhKpBHpkmKMkepppwHxZOm6A7TlVozeqkNmJcFkPvHdeJAW5cTvmnXbXQLO2TMsClKWNFIJlPVdeEOAxB6nxvOC21bHXa387QjdGZtWd-lJBi1d5nX8Q4tcaiIwkGinKgvWACppGDHdcLYv6tpTBqtcMg5dEaiIp3XPQBTMGkHHTKBw61QSxljveHQHs9ziEUIdjOfwC-lJBi1d56sPBA81mvhIcCDBcFrbcXch0e21LjM6RqAJm3O4cogRtQKDcFrbcXcHwnxWboZjy6f..; alg_wc_ev_my_account_referer_url=https%3A%2F%2Fcnfans.com%2F; wordpress_logged_in_1273fbaa4a68e02db5671ebfa25c84f6=1176502723%7C1733143935%7CDAV9iMENdzv6MJXA7SaDjQE0ZHAIqyqDiMdJUVjk5oi%7Cfd6535b6c0e8d5a853da978f73344c10ec1c7fe213a98f1e06612879317b4b6e; stream-identify=yes; __ukey=7run64g3x534; wmc_current_currency=USD; wmc_current_currency_old=USD; _gcl_au=1.1.1358546998.1731652189.1378589500.1733124367.1733124367; _gid=GA1.2.1540963020.1733124372; lf_prev_visit=1733124368638; lf_this_visit=1733132569815; lf_session_count=19; _ga=GA1.2.1082485873.1731652189; cf_clearance=trqro6oGnpRPNhOWj5BMk63M77K6wyuNaqwDnHG0o4U-1733132576-1.2.1.1-PIHLbb61Bxko73QV6Ef6Ice2VtYPk5vBvTTBFQ5NLI5JyHhwrLq1VVyF88dIW1AjqeNLrxxjo5NgdPoI0j_T.cvxz4B3R9ttjtQzNlhgiWwsofUpyespYR0g3jG5gMRJ6SGKXwxFUzer38F6xoHrfE9fI9esn6uqQk0TyXVkdI8bLPFKJuQWUl_pJjAU44NYGt3tWqKVvC6w.hzgo7Fy6vohQwoP3B7xVRd6tUgSkwOYvGJ_LgAJU1ud2Dhq8szCk10FzrvITQXSeatxO4mnDceMkNZNpynVZTFwBBEvm3_c8rnhkWN6jURsZmvWOTDote4jQfclVWTVXwO7ZqFKI.A8Dein9Dva8Bhag2vtfJQ.JHwbVtOnLy4Srb2EIzUs; _ga_GVNMMZMPG4=GS1.1.1733132569.19.1.1733132576.53.0.0; lf_prev_send_time=1733132600414'
//               // 可以在这里添加更多的headers
//             }
//         }).then(response => {
//             if(response.data.result && response.data.result.records) {
//                 //const _retUri = util.format(this.uufindQC, response.data.result.records[0].id);
//                 console.log(response.data.result.records);
//                 _result.uufindsQCLink = util.format(this.uufindQC, response.data.result.records[0].id);
//                 fn(_result);
//             } else {
//                 console.error('Result or Records null');
//             }
//         }).catch(error => {
//             console.error('Error fetching the page:', error.message);
//         });
//     }

//     mapCNFansShopType = new Map([
//         ['weidian', 'https://weidian.com/item.html?itemID=%s'],
//         ['taobao', 'https://item.taobao.com/item.htm?id=%s'],
//         ['ali_1688', 'https://detail.1688.com/offer/%s.html'],
//         ['tmall', 'tmall.com']
//       ]);
    
//     //https://detail.1688.com/offer/768691640137.html
//     getUUFindsUri(uri) {
//         //let _retUri = uri.href;
//         let _ret = {};
//         _ret.rawLink = uri.href;//传入的原始Link
//         _ret.cnLink = uri.href;//传入的原始Link，如果是Buy的链接，则会替换成国内网站的链接，如果不是Buy的链接，则和原始链接一样
//         switch(uri.host) {
//             case "cnfans.com":
//             case "joyabuy.com": {
//                 const shop_type = uri.searchParams.get("shop_type");
//                 const item_id = uri.searchParams.get("id");
//                 let cnLink = this.mapCNFansShopType.get(shop_type);
//                 cnLink = util.format(cnLink, item_id);
//                 _ret.cnLink = cnLink;
//                 _ret.buyLink = uri.href;//匹配到了，说明是buy的link
//             } break;
//             case "hoobuy.com": {
//                 console.log("hoobuy.com");
//             } break;
//             case "oopbuy.com":{
//                 console.log("oopbuy.com");
//                 //https://oopbuy.com/goods/details?id=824487118114&channel=1688
//             } break;
//             default: {
//                 console.log("unknown host");
//                 //https://m.lovegobuy.com/product?id=830017242421&shop_type=ali_1688&invite_code=2KTR23
//             } break;
//         }
//         _ret.uufindsApiLink = util.format(this.uufindUrl, encodeURIComponent(_ret.cnLink));
        
//         return _ret;
//     }
// }