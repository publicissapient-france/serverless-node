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
    "buildDev": "serverless deploy",
    "buildProd": "serverless deploy -s prod",
    "logs": "serverless logs -t -f answer",
    "deployDev": "serverless deploy function -v -f answer",
    "deployProd": "serverless deploy function -s prod -f answer"
    "testLocal": "test/scripts/testAll.sh",
    "testDev": "newman run test/extreme_startup.postman_collection.json -e test/extreme_startup.postman_environment.json --reporter-cli-no-assertions",
    "deployDev": "serverless deploy function -v -f answer",
    "deployProd": "serverless deploy function -s prod -f answer"
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
# testAll.sh
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
# Environnement
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
base_sns: ${file(arns.yml):base_sns}
# arn.yml
```



