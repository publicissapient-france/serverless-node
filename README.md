# Déroulement du slot

## Cas nominal

Prérequis : disposer de credentials AWS (dans votre répertoire .aws)

Utiliser le conteneur préchargé depuis votre répertoire projet.
```
docker run -ti -v /Users/<user>/.aws/:/root/.aws  -v $PWD:/opt/project   --name serverless xebiafrance/serverless-node
```

Créer un premier squelette de lambda
```
serverless create --template aws-nodejs --path extreme-startup
cd extreme-startup
npm init -f
```

Modifier le serverless.xml pour être plus descriptif
```
sed -i '/^#/ d' serverless.yml
mv handler.js answer.js
sed -i 's/handler\./answer\./g' serverless.yml
sed -i '/provider/a \ \ region: eu-west-1' serverless.yml
sed -i 'N;/^\n$/d;P;D' serverless.yml
```

Outiller son npm. Supprimer le main. Ajouter les scrips suivants
```
"scripts": {
    "testLocal": "test/scripts/testAll.sh",
    "pretestDev": "test/scripts/fillDevEnvProperties.sh",
    "testDev": "newman run test/extremStartup.postman_collection.json -e test/extremStartup.postman_environment.json --reporter-cli-no-assertions",
    "deployDev": "serverless deploy function -v -f answer",
    "deployProd": "serverless deploy function -s prod -f answer",
    "logs": "serverless logs -t -f answer -s prod",
    "buildDev": "serverless deploy",
    "buildProd": "serverless deploy -s prod"
  }
```

Déployer !
```
npm run buildProd
```

Vérifier
```
serverless invoke -f hello -s prod
```

Modifier les fonctions pour les rendre plus parlantes.
```
Renommer le handler hello en answer
Renommer la fonction en receiveQuestion
```

Ajouter un endpoint HTTP
```
events:
  - http:
      path: /
      method: get
      integration: lambda
```

Faire tourner les logs en externe:
```
docker exec -ti serverless bash -c 'cd /opt/project/extreme-startup ; exec npm run logs'
```

Modifier le handler pour renvoyer du text/plain
```
context.succeed(answer)
```

Redéployer uniquement la fonction
```
npm run deployProd
```

S'inscrire sur le serveur Extreme Startup

## Passer en mode craft

Créer un premier test
```
# event-name.json
{
  "query": {
    "q": "b3ef3ef0: what is your name"
  }
}
# event-name.json-result.txt
<Your name>
```

Créer un script pour passer tous les tests en local
```
# test/scripts/testAll.sh #
#!/bin/bash

failCount=0
RED='\033[0;31m'
NC='\033[0m'
GREEN='\033[0;32m'

for f in $PWD/test/event*.json ;
do
  echo "Processing `basename $f` file..."
  output=$(serverless invoke  local -f answer -p $f -s local | tail -n 1)
  output="${output%\"}"
  output="${output#\"}"
  #echo $output

  if [ ! -f $f-result.txt ]; then
      touch $f-result.txt
      echo "KO" >> $f-result.txt
  fi

  expectedOutput=$(cat $f-result.txt)
  #echo $expectedOutput

  if [ "$expectedOutput" == "$output" ]; then
    printf "${GREEN}Test passed for `basename $f`${NC}\n"
  else
    printf "${RED}Test failed for `basename $f`${NC} : expected ${GREEN}$expectedOutput ${NC}, got ${RED}$output${NC}\n"
    ((failCount++))
  fi
done

if [ "$failCount" -gt 0 ] ; then
  printf "${RED}$failCount test(s) failed${NC}"
  exit 1
fi

```

Déployer un environnement de dev
```
npm run buildDev
```

Utiliser Postman pour créer un test d'intégration
```
# Url
{{protocol}}://{{domain}}/{{path}}?q=b3ef3ef1: what is your name
# Test
tests["Body matches string"] = responseBody.has("Pabs");
tests["Status code is 200"] = responseCode.code === 200;

```
Créer un script pour générer le fichier d'environnement
```
# test/scripts/fillDevEnvProperties

#!/bin/bash

STR=$(serverless info -s dev | awk '/endpoints/{getline; print}' | awk -F'- ' '{print $NF}')
SCHEME=${STR%://*}
URL=${STR#*//}
DOMAIN=${URL%/*}
URL_PATH=${STR##*/}

cat test/extremStartup.postman_environment.json.template | \
jq --arg scheme $SCHEME -r \
'(.values[] | select(.key=="protocol") | .value )=$scheme' | \
jq --arg path $URL_PATH -r \
'(.values[] | select(.key=="path") | .value )=$path' | \
jq --arg domain $DOMAIN -r \
'(.values[] | select(.key=="domain") | .value )=$domain' > \
test/extremStartup.postman_environment.json
```

Réaliser un test d'intégration
```
npm run testDev
```

## Aller plus loin
Scraper la réponse auprès du serveur
```
npm install -S request
# checker.js
request(url, function (error, response, html) {
    console.log(html)
})

npm install -S cheerio
# checker.js
var $ = cheerio.load(html);

var correctLi = $('li').filter(function () {
    return $(this).find('div').first().text().trim() === id;
})
var points = correctLi.first().find('div').first().next().next().text();
var score = points.substring(points.indexOf(":") + 2)
console.log(score)
```

Créer une nouvelle lambda, trigger par SNS
```
# checker.js
module.exports.scrapResult = (id, callback) => { callback(score) }
var message = JSON.parse(event.Records[0].Sns.Message)
var id = message.id
var question = message.question
var answer = message.answer

# serverless.yml
environment:
    stage: ${opt:stage, self:provider.stage}
    region: ${opt:region, self:provider.region}
    topic_sns: ${self:provider.environment.stage}-checkAnswer

check:
  handler: answer.checkResult
  events:
    - sns: ${self:provider.environment.topic_sns}
```

Tester unitairement
```
#check-result.json
{
  "Records": [
    {
      "Sns": {
        "Message": "{\"question\": \"what is your name\",\"id\": \"1c108850\",\"answer\": \"Pab\"}"
      }
    }
  ]
}

serverless invoke local -f check -p test/check-result.json
```

Chainer les lambdas
```
npm install -S aws-sdk
# answer.js
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

# serverless ninja trick
base_sns:
      Fn::Join:
        - ":"
        - - arn
          - aws
          - sns
          - Ref: AWS::Region
          - Ref: AWS::AccountId
```

Créer des tests d'intégration dans S3
```
# checker.js
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
        awsOperation.s3Push(params, (fileCreated) => {
            if (fileCreated) {
                callback("Test created")
            } else {
                callback("S3 error occurred")
            }
        })
    } else {
        callback("Test is already written")
    }
})
```

Utiliser la cli d'AWS pour synchroniser avec le bucket
```
# test/scripts/continuousTest.sh #
#!/bin/bash

while true;
do
    aws s3 sync s3://prod-check-answer ./test/
    npm run testLocal --silent
    sleep 10
done

```

Fixer les tests !



