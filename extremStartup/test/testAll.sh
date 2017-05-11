#!/bin/bash

for f in $PWD/test/event*.json ;
do
  echo "Processing $f file..."
  output=$(serverless invoke  local -f answer -p $f | tail -n 1)
  output="${output%\"}"
  output="${output#\"}"
  #echo $output
  expectedOutput=$(cat $f-result.txt)
  #echo $expectedOutput

  if [ "$expectedOutput" == "$output" ]; then
    echo "Test passed"
  fi
done
