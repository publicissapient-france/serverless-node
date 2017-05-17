const request = require('request');
const cheerio = require('cheerio');
const awsOperation = require('./awsOperation')

const url = process.env.base_url + process.env.player_id


module.exports.scrapResult = (id, callback) => {
    request(url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var correctLi = $('li').filter(function () {
                return $(this).find('div').first().text().trim() === id;
            })
            //var answer = correctLi.first().find('div').first().next().text();
            var points = correctLi.first().find('div').first().next().next().text();

            var score = points.substring(points.indexOf(":") + 2)

            callback(score)
        } else {
            console.log(error)
        }

    })
}

module.exports.createTest = (id, question, score, callback) => {
    var content = {
        "query": {
            "q": id + ": " + question,
            "score": score
        }
    }

    var fileName = question.replace(/[0-9]/g, "X")
    fileName = fileName.replace(/X+/g, "X")
    fileName = fileName.replace(/ +/g, "_")

    var params = {
        Bucket: process.env.test_bucket,
        Key: 'event-' + fileName + '.json'
    };

    awsOperation.s3FileExists(params, (exists) => {
        if (!exists) {
            params = {
                Bucket: process.env.test_bucket,
                Key: 'event-' + fileName + '.json',
                Body: JSON.stringify(content)
            };
            awsOperation.s3Push(params, callback)
        } else {
            callback("Test is already written")
        }
    })
}