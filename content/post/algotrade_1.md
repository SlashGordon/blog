---
title: "Algo trading part 1 - how to receive price data"
path: "algo_trading_part_1_scan_and_price_data"
template: "algo_trading_part_1_scan_and_price_data.html"
date: 2021-06-18T01:53:34+08:00
lastmod: 2021-06-18T01:53:34+08:00
tags: ["algotrading", "trading", "python", "stock", "data", "price"]
categories: ["tutorial"]
---

One of the important challenges in algo trading is to scan 1000 and more stocks and do some magic with the price data.
But how can we get the price data?
<!--more-->
## How can we get the price data?

There a tons of projects on github to get price data and my favorite is [yfinance](https://github.com/ranaroussi/yfinance).

The following examples shows us how to receive microsoft stock prices:

```python
import yfinance as yf
msft = yf.Ticker("MSFT")
# get stock info
msft.info
# get historical market data
hist = msft.history(period="max")
```

The lib needs a thicker symbol to download historical market data so we need a database with all important stock symbols.

## How can we get the stock symbols?

I wrote a lib by myself for this problem. The name is [pytickersymbols](https://github.com/portfolioplus/pytickersymbols) and is completely open for everyone.

The syntax is quite simple:

```python
import yfinance as yf
from pytickersymbols import PyTickerSymbols

stock_data = PyTickerSymbols()

sp100_yahoo = stock_data.get_sp_100_nyc_yahoo_tickers()
sp500_google = stock_data.get_sp_500_nyc_yahoo_tickers()
dow_yahoo = stock_data.get_dow_jones_nyc_yahoo_tickers()

us_stocks = sp100_yahoo + sp500_google + dow_yahoo

for us_stock in us_stocks:
   stock_data = yf.Ticker(us_stock)
   data = stock_data.history(period="max")
   # save data for analysis purposes
   data.to_csv(f'{us_stock}.csv', sep='\t', encoding='utf-8')
   # do magic stuff wit price data
   data['SMA(5)'] = data.open.rolling(5).mean()
   data['SMA(15)'] = data.open.rolling(15).mean()
   df['Buy'] = df['SMA(5)'].ge(df['SMA(15)'])
   data.to_csv(f'{us_stock}.csv', sep='\t', encoding='utf-8')
```

With the script above we are able to download price data from 640 different stocks and can generate buy signals with the simple SMA algo. Wow :D