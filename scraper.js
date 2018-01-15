// This is a template for a Node.js scraper on morph.io (https://morph.io)

var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();
var tress = require('tress');


var results = [];

var opt = {
    url: 'https://www.worldcoinindex.com',
    encoding: null
}

var URL = 'https://www.worldcoinindex.com';

// `tress` последовательно вызывает наш обработчик для каждой ссылки в очереди
var q = tress(function(opt, callback){

    //тут мы обрабатываем страницу с адресом url
    request(opt, function (err, res, body) {
        if (err) throw err;

        //console.log(iconv.decode(body, 'win1251'));
        //console.log(res.statusCode);

        // парсим DOM
        var $ = cheerio.load(body);

        $("[class~=\"coinzoeken\"]").each(function(i, elem) {

            results.push([
                $(elem).find(".bitcoinName h1 span").text(),
                $(elem).find(".ticker h2").text(),
                $(elem).find(".pricekoers.lastprice [class='span']").text()
            ]);
        });

        // $('btn btn-default pull-right').text().indexOf("Previous") > 0
        var nextpage = $("a:contains('Next')");
        if(nextpage.length > 0) {
            console.log("Работает!!!!!");

            var nextURL = {
                url: URL + nextpage.attr('href'),
                encoding: null
            }

            console.log(nextURL);
            //q.push(nextURL);

        } else {
            console.log("Дно достигнуто!!!");
        }

        callback(); //вызываем callback в конце
    });
});

// эта функция выполнится, когда в очереди закончатся ссылки
q.drain = function(){
    //fs.writeFileSync('./data.json', JSON.stringify(results, null, 4));
    var db = new sqlite3.Database('data.sqlite');
    db.serialize(function(){
        db.run('DROP TABLE IF EXISTS data');
        db.run('CREATE TABLE data (name TEXT, ticker TEXT, last_price TEXT)');
        var stmt = db.prepare('INSERT INTO data VALUES (?, ?, ?)');
        for (var i = 0; i < results.length; i++) {
            stmt.run(results[i]);
        };
        stmt.finalize();
        db.close();
    });
}

// добавляем в очередь ссылку на первую страницу списка
q.push(opt);
