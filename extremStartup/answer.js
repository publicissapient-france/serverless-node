'use strict';
const checker = require("./checker")
const awsOperation = require("./awsOperation")
const answerBuilder = require("./answerBuilder")

const topicArn = process.env.base_sns + ":" + process.env.topic_sns
const local = (process.env.stage == "local")

module.exports.receiveQuestion = (event, context, callback) => {
    //console.log(process.env)

    var q = event.query.q

    var id = q.substring(0, q.indexOf(":"))
    var question = q.substring(q.indexOf(":") + 2)

    var answer = answerBuilder.answer(question)
    console.log(id, question, answer)

    if (!local) {
        var message = {
            "question": question,
            "id": id,
            "answer": answer
        }

        const params = {
            Message: JSON.stringify(message),
            TopicArn: topicArn
        };

        awsOperation.snsPublish(params, (error, data)=> {
            if (error) {
                callback(error);
            }
            context.succeed(answer)
        })
    } else {
        context.succeed(answer)
    }

};

module.exports.checkResult = (event, context, callback) => {

    var message = JSON.parse(event.Records[0].Sns.Message)
    var id = message.id
    var question = message.question
    var answer = message.answer

    checker.scrapResult(id, (score) => {
            console.log("Checked", id, question, answer, score)
            if (score < 0) {
                // create a unit test
                checker.createTest(id, question, score, (message) => {
                    callback(null, message)
                })

            } else {
                callback(null, "Score is positive")
            }
        }
    )
}

