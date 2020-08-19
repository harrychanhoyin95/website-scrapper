import axios from 'axios';
import cheerio from 'cheerio';
import _ from 'lodash'
import pkg from 'convert-array-to-csv';

import { tobaccos } from './tobaccos.js'

const { convertArrayToCSV } = pkg;

function parseHtml (html) {
  const data = {};
  const $ = cheerio.load(html);
  $('h1[itemprop="name"]').each((i, elem) => {
    data.name = $(elem).text()
  })
  $('input[name="GrandTotal"]').each((i, elem) => {
    data.price = $(elem).val()
  })
  return data;
};

async function fetchData(url, index) {
  return new Promise((resolve, reject) => {
    axios.get(url)
      .then(res => resolve(parseHtml(res.data)))
      .catch(error => console.log(error))
  })
}

function parsePrice(price) {
  const noDollarSignPrice = price.replace('$', '')
  return Number(noDollarSignPrice)
}

const getList = async() => {
  const biggerPromises = tobaccos.map(async(t, index) => {
    const promises = t.types.map(async(type) => {
      const data = {}
      const typeData = await fetchData(type.url, index)
      const costPerGramInUSD = type.grams / parsePrice(typeData.price)

      data["CategoryName"] = t.name
      data["Name"] = typeData.name
      data["Price"] = parsePrice(typeData.price)
      data["Grams"] = type.grams
      data["Cost/gram(USD)"] = costPerGramInUSD.toFixed(2)
      data["Cost/gram(HKD)"] = (costPerGramInUSD / 7.8).toFixed(2)
      data["URL"] = type.url
      return data
    })
    return Promise.all(promises)
  })
  return Promise.all(biggerPromises)
}

const flattenDeepList = _.flattenDeep(await getList())

const header = ["CategoryName", "Name", "Price", "Grams", "Cost/gram(USD)", "Cost/gram(HKD)", "URL" ]
const csv = convertArrayToCSV(flattenDeepList, { header })

console.log("csv", csv)