'use strict';
const math = require('mathjs');

// Keywords
const largest = "largest: "
const whatIs = "what is "

module.exports.answer = (question) => {
    if (question.indexOf("plus") > -1) {
        question = question.substring(question.indexOf(whatIs) + whatIs.length)
        question = question.replace(/(plus)+/g, "+")
        console.log(question)

        return math.eval(question)
    } else if (question.indexOf(largest) > -1) {
        question = question.substring(question.indexOf(largest) + largest.length)
        var numbers = question.split(",")

        return math.sort(numbers, "desc")[0]
    } else {
        return "Pabs"
    }
}