#!/bin/bash

LOGFILE=/home/viiksipo/github-hook.log

#POST=$(cat) # dunno why this works but none of the internet recommended/sensible variants
#POST=$(</dev/stdin)
#while read line; do
# # something
#done < /dev/stdin

REMOTE=$(dig -x $REMOTE_ADDR +short)
echo $(date -u +'%Y-%m-%d %H:%M:%S') $REMOTE >> $LOGFILE

if [ "${REMOTE:${#REMOTE}-12}" = ".github.com." ]; then
	/home/viiksipo/github/checkout.sh
fi

# RESPONSE
echo "Content-type: text/html"
echo 
echo LAZER BEAMS ABLAZE
