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
