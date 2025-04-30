# crypto
Crypto Currency data fatching using coingeko & coinmarketcap.

coingeko api : https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=1000&page=1

coinmarketcap api : https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest

Note: Install axios( for using the code base)

Note: For postman testing:
( for using coinmarketcap you have to create an account and login to the dashboard, then you have to generate secret kry. For example:
headers:
json body {
Accept:application/json
X-CMC_PRO_API_KEY: your generated key
})

---OR You Can See The Postman Doc---
https://documenter.getpostman.com/view/35147826/2sB2j3CXfB
