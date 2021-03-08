const readline = require("readline");
const cliSelect = require('cli-select');
const util = require('util');

const fetch = require('node-fetch');
const mongoose = require('mongoose');

const { newsSchema } = require('../model/news');

const pageSize = 100;
const defaultDbName = "mongodb";
const defaultTableName = "news";
const defaultQuery = "node.js";
const apiKey = "";
const languages = ["All languages", "en", "ru"];

async function loadNews() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = util.promisify(rl.question).bind(rl);

  const dbName = await question(`Type db name(${defaultDbName}): `) || defaultDbName;
  const tableName = await question(`Type table name(${defaultTableName}): `) || defaultTableName;
  const query = await question(`Type query(${defaultQuery}): `) || defaultQuery;

  rl.write("Choose language: \n");

  const language = await cliSelect({
    values: languages,
    valueRenderer: (value, _) => value
  });
  
  rl.close();

  console.log("Starting: ");
  console.log("db: ", dbName);
  console.log("table: ", tableName);
  console.log("query: ", query);
  console.log("language: ", language);

  await mongoose.connect('mongodb://localhost/' + dbName, {useNewUrlParser: true, useUnifiedTopology: true});

  console.log("Connected to MongoDB database: ", dbName);

  const News = mongoose.model(tableName, newsSchema);

  console.log(`Model ${tableName} created`);

  let totalResults = 0;

  let baseUrl = `https://newsapi.org/v2/everything?apiKey=${apiKey}&pageSize=${pageSize}`;

  if(language.id > 0) {
    baseUrl += `&language=${language.value}&q=${query}`;
  }

  for(let page = 1; page <= totalResults / pageSize + 1; page++) {
    let url = encodeURI(baseUrl + "&page=" + page);

    console.log("Starting fetch: ", url);

    const res = await fetch(url);
    const data = await res.json();

    if(data.status === "ok") {
      totalResults = data.totalResults;
      console.log("totalResults = ", totalResults, ", articles loaded = ", data.articles.length);

      await News.insertMany(data.articles);
    }
    else {
      console.log("Error: ", data.status);
      break;
    }
  }
}

module.exports = { loadNews };
