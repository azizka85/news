const { loadNews } = require('./generator/newsapi');

loadNews().then(() => process.exit());
