import { Currency } from '../types/currency';

export const currencies: Currency[] = [
  // 主要货币
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸', country: '美国' },
  { code: 'CNY', name: '中国人民币', symbol: '¥', flag: '🇨🇳', country: '中国' },
  { code: 'EUR', name: '欧元', symbol: '€', flag: '🇪🇺', country: '欧盟' },
  { code: 'GBP', name: '英镑', symbol: '£', flag: '🇬🇧', country: '英国' },
  { code: 'JPY', name: '日元', symbol: '¥', flag: '🇯🇵', country: '日本' },
  
  // 亚洲主要货币
  { code: 'KRW', name: '韩元', symbol: '₩', flag: '🇰🇷', country: '韩国' },
  { code: 'HKD', name: '港元', symbol: 'HK$', flag: '🇭🇰', country: '中国香港' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$', flag: '🇸🇬', country: '新加坡' },
  { code: 'INR', name: '印度卢比', symbol: '₹', flag: '🇮🇳', country: '印度' },
  { code: 'TWD', name: '台币', symbol: 'NT$', flag: '🇹🇼', country: '中国台湾' },
  { code: 'THB', name: '泰铢', symbol: '฿', flag: '🇹🇭', country: '泰国' },
  { code: 'MYR', name: '马来西亚林吉特', symbol: 'RM', flag: '🇲🇾', country: '马来西亚' },
  { code: 'IDR', name: '印尼盾', symbol: 'Rp', flag: '🇮🇩', country: '印尼' },
  { code: 'PHP', name: '菲律宾比索', symbol: '₱', flag: '🇵🇭', country: '菲律宾' },
  { code: 'VND', name: '越南盾', symbol: '₫', flag: '🇻🇳', country: '越南' },
  { code: 'PKR', name: '巴基斯坦卢比', symbol: '₨', flag: '🇵🇰', country: '巴基斯坦' },
  { code: 'BDT', name: '孟加拉塔卡', symbol: '৳', flag: '🇧🇩', country: '孟加拉' },
  { code: 'LKR', name: '斯里兰卡卢比', symbol: 'Rs', flag: '🇱🇰', country: '斯里兰卡' },
  
  // 北美洲货币
  { code: 'CAD', name: '加拿大元', symbol: 'C$', flag: '🇨🇦', country: '加拿大' },
  { code: 'MXN', name: '墨西哥比索', symbol: '$', flag: '🇲🇽', country: '墨西哥' },
  
  // 大洋洲货币
  { code: 'AUD', name: '澳元', symbol: 'A$', flag: '🇦🇺', country: '澳大利亚' },
  { code: 'NZD', name: '新西兰元', symbol: 'NZ$', flag: '🇳🇿', country: '新西兰' },
  
  // 欧洲货币
  { code: 'CHF', name: '瑞士法郎', symbol: 'CHF', flag: '🇨🇭', country: '瑞士' },
  { code: 'NOK', name: '挪威克朗', symbol: 'kr', flag: '🇳🇴', country: '挪威' },
  { code: 'SEK', name: '瑞典克朗', symbol: 'kr', flag: '🇸🇪', country: '瑞典' },
  { code: 'DKK', name: '丹麦克朗', symbol: 'kr', flag: '🇩🇰', country: '丹麦' },
  { code: 'PLN', name: '波兰兹罗提', symbol: 'zł', flag: '🇵🇱', country: '波兰' },
  { code: 'CZK', name: '捷克克朗', symbol: 'Kč', flag: '🇨🇿', country: '捷克' },
  { code: 'HUF', name: '匈牙利福林', symbol: 'Ft', flag: '🇭🇺', country: '匈牙利' },
  { code: 'RON', name: '罗马尼亚列伊', symbol: 'lei', flag: '🇷🇴', country: '罗马尼亚' },
  { code: 'BGN', name: '保加利亚列弗', symbol: 'лв', flag: '🇧🇬', country: '保加利亚' },
  { code: 'HRK', name: '克罗地亚库纳', symbol: 'kn', flag: '🇭🇷', country: '克罗地亚' },
  { code: 'RSD', name: '塞尔维亚第纳尔', symbol: 'дин', flag: '🇷🇸', country: '塞尔维亚' },
  { code: 'TRY', name: '土耳其里拉', symbol: '₺', flag: '🇹🇷', country: '土耳其' },
  { code: 'RUB', name: '俄罗斯卢布', symbol: '₽', flag: '🇷🇺', country: '俄罗斯' },
  { code: 'UAH', name: '乌克兰格里夫纳', symbol: '₴', flag: '🇺🇦', country: '乌克兰' },
  
  // 中东货币
  { code: 'SAR', name: '沙特里亚尔', symbol: '﷼', flag: '🇸🇦', country: '沙特阿拉伯' },
  { code: 'AED', name: '阿联酋迪拉姆', symbol: 'د.إ', flag: '🇦🇪', country: '阿联酋' },
  { code: 'QAR', name: '卡塔尔里亚尔', symbol: '﷼', flag: '🇶🇦', country: '卡塔尔' },
  { code: 'KWD', name: '科威特第纳尔', symbol: 'د.ك', flag: '🇰🇼', country: '科威特' },
  { code: 'BHD', name: '巴林第纳尔', symbol: '.د.ب', flag: '🇧🇭', country: '巴林' },
  { code: 'OMR', name: '阿曼里亚尔', symbol: '﷼', flag: '🇴🇲', country: '阿曼' },
  { code: 'JOD', name: '约旦第纳尔', symbol: 'د.ا', flag: '🇯🇴', country: '约旦' },
  { code: 'LBP', name: '黎巴嫩镑', symbol: '£', flag: '🇱🇧', country: '黎巴嫩' },
  { code: 'ILS', name: '以色列新谢克尔', symbol: '₪', flag: '🇮🇱', country: '以色列' },
  { code: 'IRR', name: '伊朗里亚尔', symbol: '﷼', flag: '🇮🇷', country: '伊朗' },
  { code: 'IQD', name: '伊拉克第纳尔', symbol: 'ع.د', flag: '🇮🇶', country: '伊拉克' },
  
  // 非洲货币
  { code: 'ZAR', name: '南非兰特', symbol: 'R', flag: '🇿🇦', country: '南非' },
  { code: 'EGP', name: '埃及镑', symbol: '£', flag: '🇪🇬', country: '埃及' },
  { code: 'NGN', name: '尼日利亚奈拉', symbol: '₦', flag: '🇳🇬', country: '尼日利亚' },
  { code: 'KES', name: '肯尼亚先令', symbol: 'KSh', flag: '🇰🇪', country: '肯尼亚' },
  { code: 'GHS', name: '加纳塞地', symbol: '₵', flag: '🇬🇭', country: '加纳' },
  { code: 'MAD', name: '摩洛哥迪拉姆', symbol: 'د.م.', flag: '🇲🇦', country: '摩洛哥' },
  { code: 'TND', name: '突尼斯第纳尔', symbol: 'د.ت', flag: '🇹🇳', country: '突尼斯' },
  { code: 'DZD', name: '阿尔及利亚第纳尔', symbol: 'د.ج', flag: '🇩🇿', country: '阿尔及利亚' },
  { code: 'AOA', name: '安哥拉宽扎', symbol: 'Kz', flag: '🇦🇴', country: '安哥拉' },
  { code: 'ETB', name: '埃塞俄比亚比尔', symbol: 'Br', flag: '🇪🇹', country: '埃塞俄比亚' },
  
  // 南美洲货币
  { code: 'BRL', name: '巴西雷亚尔', symbol: 'R$', flag: '🇧🇷', country: '巴西' },
  { code: 'ARS', name: '阿根廷比索', symbol: '$', flag: '🇦🇷', country: '阿根廷' },
  { code: 'CLP', name: '智利比索', symbol: '$', flag: '🇨🇱', country: '智利' },
  { code: 'COP', name: '哥伦比亚比索', symbol: '$', flag: '🇨🇴', country: '哥伦比亚' },
  { code: 'PEN', name: '秘鲁索尔', symbol: 'S/', flag: '🇵🇪', country: '秘鲁' },
  { code: 'UYU', name: '乌拉圭比索', symbol: '$U', flag: '🇺🇾', country: '乌拉圭' },
  { code: 'BOB', name: '玻利维亚诺', symbol: 'Bs', flag: '🇧🇴', country: '玻利维亚' },
  { code: 'PYG', name: '巴拉圭瓜拉尼', symbol: '₲', flag: '🇵🇾', country: '巴拉圭' },
  { code: 'VES', name: '委内瑞拉玻利瓦尔', symbol: 'Bs.S', flag: '🇻🇪', country: '委内瑞拉' },
  
  // 其他重要货币
  { code: 'ISK', name: '冰岛克朗', symbol: 'kr', flag: '🇮🇸', country: '冰岛' },
  { code: 'XOF', name: '西非法郎', symbol: 'CFA', flag: '🌍', country: '西非' },
  { code: 'XAF', name: '中非法郎', symbol: 'FCFA', flag: '🌍', country: '中非' },
];

export const exchangeRates: Record<string, Record<string, number>> = {
  USD: {
    CNY: 7.1706, EUR: 0.85, GBP: 0.73, JPY: 110.25, KRW: 1205.50,
    HKD: 7.80, CAD: 1.25, AUD: 1.35, CHF: 0.92, SGD: 1.35,
    INR: 74.25, TWD: 31.50, THB: 33.25, MYR: 4.15, IDR: 14250,
    PHP: 50.25, VND: 23500, PKR: 155.75, BDT: 85.50, LKR: 180.25,
    MXN: 20.15, NZD: 1.42, NOK: 8.65, SEK: 8.95, DKK: 6.35,
    PLN: 3.85, CZK: 21.75, HUF: 295.50, RON: 4.15, BGN: 1.66,
    HRK: 6.42, RSD: 99.85, TRY: 8.45, RUB: 75.25, UAH: 27.15,
    SAR: 3.75, AED: 3.67, QAR: 3.64, KWD: 0.30, BHD: 0.38,
    OMR: 0.38, JOD: 0.71, LBP: 1507.50, ILS: 3.25, IRR: 42000,
    IQD: 1310, ZAR: 14.85, EGP: 15.75, NGN: 411.50, KES: 108.25,
    GHS: 5.85, MAD: 8.95, TND: 2.75, DZD: 134.50, AOA: 555.75,
    ETB: 44.25, BRL: 5.15, ARS: 98.75, CLP: 795.50, COP: 3850,
    PEN: 3.65, UYU: 43.85, BOB: 6.91, PYG: 6950, VES: 4.18,
    ISK: 125.50, XOF: 558.75, XAF: 558.75,
  },
  CNY: {
    USD: 0.1394, EUR: 0.118, GBP: 0.102, JPY: 15.36, KRW: 167.89,
    HKD: 1.09, CAD: 0.174, AUD: 0.188, CHF: 0.128, SGD: 0.188,
    INR: 10.34, TWD: 4.39, THB: 4.64, MYR: 0.58, IDR: 1987,
    PHP: 7.01, VND: 3277, PKR: 21.72, BDT: 11.92, LKR: 25.14,
    MXN: 2.81, NZD: 0.198, NOK: 1.21, SEK: 1.25, DKK: 0.886,
    PLN: 0.537, CZK: 3.03, HUF: 41.2, RON: 0.579, BGN: 0.231,
    HRK: 0.895, RSD: 13.93, TRY: 1.18, RUB: 10.49, UAH: 3.79,
    SAR: 0.523, AED: 0.512, QAR: 0.508, KWD: 0.042, BHD: 0.053,
    OMR: 0.053, JOD: 0.099, LBP: 210.3, ILS: 0.453, IRR: 5858,
    IQD: 182.7, ZAR: 2.07, EGP: 2.20, NGN: 57.4, KES: 15.1,
    GHS: 0.816, MAD: 1.25, TND: 0.384, DZD: 18.76, AOA: 77.5,
    ETB: 6.17, BRL: 0.718, ARS: 13.77, CLP: 110.9, COP: 537,
    PEN: 0.509, UYU: 6.12, BOB: 0.964, PYG: 969, VES: 0.583,
    ISK: 17.5, XOF: 77.9, XAF: 77.9,
  },
  EUR: {
    USD: 1.18, CNY: 8.45, GBP: 0.86, JPY: 129.85, KRW: 1418.25,
    HKD: 9.18, CAD: 1.47, AUD: 1.59, CHF: 1.08, SGD: 1.59,
    INR: 87.35, TWD: 37.12, THB: 39.15, MYR: 4.89, IDR: 16775,
    PHP: 59.15, VND: 27650, PKR: 183.25, BDT: 100.65, LKR: 212.15,
    MXN: 23.75, NZD: 1.67, NOK: 10.18, SEK: 10.53, DKK: 7.47,
    PLN: 4.53, CZK: 25.59, HUF: 347.85, RON: 4.89, BGN: 1.96,
    HRK: 7.56, RSD: 117.65, TRY: 9.95, RUB: 88.65, UAH: 31.95,
    SAR: 4.42, AED: 4.32, QAR: 4.29, KWD: 0.354, BHD: 0.447,
    OMR: 0.447, JOD: 0.837, LBP: 1775.85, ILS: 3.83, IRR: 49420,
    IQD: 1542.8, ZAR: 17.48, EGP: 18.54, NGN: 484.35, KES: 127.45,
    GHS: 6.89, MAD: 10.54, TND: 3.24, DZD: 158.35, AOA: 654.15,
    ETB: 52.15, BRL: 6.06, ARS: 116.25, CLP: 936.15, COP: 4533,
    PEN: 4.30, UYU: 51.65, BOB: 8.13, PYG: 8181, VES: 4.92,
    ISK: 147.85, XOF: 658.15, XAF: 658.15,
  },
};

// 币种元数据映射表（供API币种补全用）
export const currencyMetaMap: Record<string, { country: string; name: string }> = {
  USD: { country: '美国', name: '美元' },
  CNY: { country: '中国', name: '人民币' },
  EUR: { country: '欧盟', name: '欧元' },
  GBP: { country: '英国', name: '英镑' },
  JPY: { country: '日本', name: '日元' },
  AUD: { country: '澳大利亚', name: '澳元' },
  CAD: { country: '加拿大', name: '加元' },
  CHF: { country: '瑞士', name: '瑞士法郎' },
  HKD: { country: '中国香港', name: '港元' },
  SGD: { country: '新加坡', name: '新加坡元' },
  NZD: { country: '新西兰', name: '新西兰元' },
  SEK: { country: '瑞典', name: '瑞典克朗' },
  KRW: { country: '韩国', name: '韩元' },
  NOK: { country: '挪威', name: '挪威克朗' },
  RUB: { country: '俄罗斯', name: '卢布' },
  INR: { country: '印度', name: '卢比' },
  MXN: { country: '墨西哥', name: '比索' },
  BRL: { country: '巴西', name: '雷亚尔' },
  ZAR: { country: '南非', name: '兰特' },
  TRY: { country: '土耳其', name: '里拉' },
  PLN: { country: '波兰', name: '兹罗提' },
  TWD: { country: '中国台湾', name: '新台币' },
  DKK: { country: '丹麦', name: '丹麦克朗' },
  THB: { country: '泰国', name: '泰铢' },
  IDR: { country: '印尼', name: '印尼盾' },
  HUF: { country: '匈牙利', name: '福林' },
  CZK: { country: '捷克', name: '捷克克朗' },
  ILS: { country: '以色列', name: '新谢克尔' },
  SAR: { country: '沙特阿拉伯', name: '里亚尔' },
  MYR: { country: '马来西亚', name: '林吉特' },
  PHP: { country: '菲律宾', name: '比索' },
  AED: { country: '阿联酋', name: '迪拉姆' },
  COP: { country: '哥伦比亚', name: '比索' },
  CLP: { country: '智利', name: '比索' },
  PKR: { country: '巴基斯坦', name: '卢比' },
  EGP: { country: '埃及', name: '埃及镑' },
  VND: { country: '越南', name: '越南盾' },
  BDT: { country: '孟加拉', name: '塔卡' },
  NGN: { country: '尼日利亚', name: '奈拉' },
  UAH: { country: '乌克兰', name: '格里夫纳' },
  QAR: { country: '卡塔尔', name: '里亚尔' },
  KWD: { country: '科威特', name: '第纳尔' },
  LKR: { country: '斯里兰卡', name: '卢比' },
  MAD: { country: '摩洛哥', name: '迪拉姆' },
  RON: { country: '罗马尼亚', name: '列伊' },
  BGN: { country: '保加利亚', name: '列弗' },
  HRK: { country: '克罗地亚', name: '库纳' },
  OMR: { country: '阿曼', name: '里亚尔' },
  JOD: { country: '约旦', name: '第纳尔' },
  DZD: { country: '阿尔及利亚', name: '第纳尔' },
  KES: { country: '肯尼亚', name: '先令' },
  PEN: { country: '秘鲁', name: '索尔' },
  IQD: { country: '伊拉克', name: '第纳尔' },
  TND: { country: '突尼斯', name: '第纳尔' },
  SYP: { country: '叙利亚', name: '镑' },
  GHS: { country: '加纳', name: '塞地' },
  XOF: { country: '西非经济货币联盟', name: '非洲金融共同体法郎' },
  XAF: { country: '中非经济货币共同体', name: '非洲金融共同体法郎' },
  ISK: { country: '冰岛', name: '克朗' },
  ARS: { country: '阿根廷', name: '比索' },
  UYU: { country: '乌拉圭', name: '比索' },
  BOB: { country: '玻利维亚', name: '玻利维亚诺' },
  PYG: { country: '巴拉圭', name: '瓜拉尼' },
  VES: { country: '委内瑞拉', name: '玻利瓦尔' },
  LBP: { country: '黎巴嫩', name: '镑' },
  BHD: { country: '巴林', name: '第纳尔' },
  MZN: { country: '莫桑比克', name: '梅蒂卡尔' },
  ETB: { country: '埃塞俄比亚', name: '比尔' },
  GMD: { country: '冈比亚', name: '达拉西' },
  MUR: { country: '毛里求斯', name: '卢比' },
  SCR: { country: '塞舌尔', name: '卢比' },
  LSL: { country: '莱索托', name: '洛蒂' },
  NAD: { country: '纳米比亚', name: '元' },
  SZL: { country: '斯威士兰', name: '里兰吉尼' },
  MOP: { country: '中国澳门', name: '澳门元' },
  TZS: { country: '坦桑尼亚', name: '先令' },
  UGX: { country: '乌干达', name: '先令' },
  RWF: { country: '卢旺达', name: '法郎' },
  MWK: { country: '马拉维', name: '克瓦查' },
  ZMW: { country: '赞比亚', name: '克瓦查' },
  GNF: { country: '几内亚', name: '法郎' },
  XPF: { country: '法属太平洋领地', name: '太平洋法郎' },
  FJD: { country: '斐济', name: '斐济元' },
  BWP: { country: '博茨瓦纳', name: '普拉' },
  MNT: { country: '蒙古', name: '图格里克' },
  KZT: { country: '哈萨克斯坦', name: '坚戈' },
  GEL: { country: '格鲁吉亚', name: '拉里' },
  MDL: { country: '摩尔多瓦', name: '列伊' },
  ALL: { country: '阿尔巴尼亚', name: '列克' },
  BAM: { country: '波黑', name: '可兑换马克' },
  MKD: { country: '北马其顿', name: '第纳尔' },
  AZN: { country: '阿塞拜疆', name: '马纳特' },
  AFN: { country: '阿富汗', name: '阿富汗尼' },
  AMD: { country: '亚美尼亚', name: '德拉姆' },
  AWG: { country: '阿鲁巴', name: '弗罗林' },
  BBD: { country: '巴巴多斯', name: '巴巴多斯元' },
  BMD: { country: '百慕大', name: '百慕大元' },
  BSD: { country: '巴哈马', name: '巴哈马元' },
  BZD: { country: '伯利兹', name: '伯利兹元' },
  CRC: { country: '哥斯达黎加', name: '科朗' },
  CUP: { country: '古巴', name: '比索' },
  DOP: { country: '多米尼加', name: '比索' },
  GTQ: { country: '危地马拉', name: '格查尔' },
  HNL: { country: '洪都拉斯', name: '伦皮拉' },
  HTG: { country: '海地', name: '古德' },
  JMD: { country: '牙买加', name: '牙买加元' },
  KYD: { country: '开曼群岛', name: '开曼元' },
  NIO: { country: '尼加拉瓜', name: '科多巴' },
  PAB: { country: '巴拿马', name: '巴波亚' },
  SBD: { country: '所罗门群岛', name: '所罗门元' },
  SRD: { country: '苏里南', name: '苏里南元' },
  TOP: { country: '汤加', name: '潘加' },
  TTD: { country: '特立尼达和多巴哥', name: '特多元' },
  UZS: { country: '乌兹别克斯坦', name: '苏姆' },
  XCD: { country: '东加勒比', name: '东加勒比元' },
  XDR: { country: '国际货币基金组织', name: '特别提款权' },
  YER: { country: '也门', name: '里亚尔' },
  ZWL: { country: '津巴布韦', name: '津巴布韦元' }
};