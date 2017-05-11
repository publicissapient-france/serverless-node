'use strict';

module.exports.answer = (event, context, callback) => {

    var question = event.query.q

    console.log(question)

    var response = "Pabs"

    context.succeed(response)
};
