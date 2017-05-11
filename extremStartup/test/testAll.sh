#!/bin/bash

failCount=0

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
    echo "Test passed for $f"
  else
    echo "Test failed for $f"
    ((failCount++))
  fi
done

if [ "$failCount" -gt 0 ] ; then
  echo "$failCount test(s) failed"
  exit 1
fi
