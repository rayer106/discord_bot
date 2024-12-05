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
    ali1688MobileTemplate = 'https://m.1688.com/offer/%s.html';
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
        'm.1688.com': this.processAli1688.bind(this),
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
        'm.1688.com': 'Ali1688',
        //'tmall.com': 'Tmall',
    };
    platformTemplate = {
        'weidian.com': this.weidianTemplate,
        'item.taobao.com': this.taobaoTemplate,
        'detail.1688.com': this.ali1688Template,
        'm.1688.com': this.ali1688Template,
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
            const tmplate = this.platformTemplate[rawUri.host];
            return util.format(tmplate, itemId);
        } else {
            throw new Error(`Invalid item ID for Weidian:itemID=${itemId}`);
        }
    }

    processTaobao(rawUri) {
        const id = rawUri.searchParams.get('id');
        if(id) {
            const tmplate = this.platformTemplate[rawUri.host];
            return util.format(tmplate, id);
        } else {
            throw new Error(`Invalid ID for Taobao:id=${id}`);
        }
    }

    processAli1688(rawUri) {        
        const match = rawUri.href.match(/offer\/(\d+)\.html/);
        if (match) {
            const id = match[1];
            if(id) {
                const tmplate = this.platformTemplate[rawUri.host];
                return util.format(tmplate, id);
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
        if (goodsData) {
            console.log("uufindsGoodsData:",goodsData);
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
                    throw new Error('data_obj is null');
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
            } catch (error) {
                console.error('Weidian数据结构变化, 解析失败', error.message);
                return null;
            }            
        }

        return {goods};
    }
}