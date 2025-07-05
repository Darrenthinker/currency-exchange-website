# 汇率兑换网站

一个现代化的实时汇率查询和兑换计算网站，支持全球主要货币的汇率转换和历史走势图表。

## 功能特性

- 🌍 支持全球 70+ 种主要货币
- 💱 实时汇率转换计算
- 📊 汇率历史走势图表
- 📱 响应式设计，支持移动端
- 🔄 货币快速交换功能
- 📈 多时间段历史数据（1天、5天、1个月、1年、5年、最大）
- 🎨 现代化 UI 设计

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **图表**: Recharts
- **图标**: Lucide React
- **代码规范**: ESLint + TypeScript ESLint

## 支持的货币

包含全球主要经济体的货币：
- 主要货币：美元(USD)、人民币(CNY)、欧元(EUR)、英镑(GBP)、日元(JPY)
- 亚洲货币：韩元、港币、新加坡元、印度卢比、台币等
- 欧洲货币：瑞士法郎、挪威克朗、瑞典克朗等
- 其他地区：加拿大元、澳元、巴西雷亚尔等

## 本地开发

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 查看网站

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## Git 仓库设置

### 1. 在本地初始化 Git 仓库

```bash
# 进入项目目录
cd 汇率兑换网站

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交初始版本
git commit -m "初始化汇率兑换网站项目"
```

### 2. 连接到 GitHub 远程仓库

```bash
# 添加远程仓库（替换为你的 GitHub 仓库地址）
git remote add origin https://github.com/你的用户名/汇率兑换网站.git

# 推送到远程仓库
git branch -M main
git push -u origin main
```

## 部署到 Netlify

### 方法一：通过 GitHub 自动部署（推荐）

1. 登录 [Netlify](https://netlify.com)
2. 点击 "New site from Git"
3. 选择 "GitHub" 并授权
4. 选择你的汇率兑换网站仓库
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. 点击 "Deploy site"

### 方法二：手动部署

1. 本地运行 `npm run build`
2. 将 `dist` 文件夹拖拽到 Netlify 部署页面

## 项目结构

```
src/
├── components/          # React 组件
│   ├── Header.tsx      # 页面头部
│   ├── CurrencySelector.tsx  # 货币选择器
│   ├── ConversionResult.tsx  # 转换结果显示
│   ├── ExchangeRateChart.tsx # 汇率图表
│   └── TimePeriodSelector.tsx # 时间段选择器
├── data/               # 数据文件
│   └── currencies.ts   # 货币数据和汇率
├── types/              # TypeScript 类型定义
│   └── currency.ts     # 货币相关类型
├── utils/              # 工具函数
│   └── currencyService.ts # 货币转换服务
├── App.tsx             # 主应用组件
├── main.tsx           # 应用入口
└── index.css          # 全局样式
```

## 自定义配置

### 添加新货币

在 `src/data/currencies.ts` 中添加新的货币数据：

```typescript
{
  code: 'XXX',
  name: '货币名称',
  symbol: '符号',
  flag: '🏳️'
}
```

### 修改汇率数据

在 `src/data/currencies.ts` 的 `exchangeRates` 对象中更新汇率数据。

### 自定义样式

项目使用 Tailwind CSS，可以在组件中直接修改 CSS 类名来调整样式。

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持 70+ 种货币
- 实时汇率转换
- 历史走势图表
- 响应式设计