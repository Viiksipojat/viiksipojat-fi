#!/bin/bash

LOGFILE=/home/viiksipo/github-hook.log

#POST=$(cat) # dunno why this works but none of the internet recommended/sensible variants
#POST=$(</dev/stdin)
#while read line; do
# # something
#done < /dev/stdin

# tää meni rikki ku github teki jotai. dig ei löydä ip:llä kivaa.
# REMOTE=$(dig -x $REMOTE_ADDR +short)
# echo $(date -u +'%Y-%m-%d %H:%M:%S') $REMOTE >> $LOGFILE
# if [ "${REMOTE:${#REMOTE}-12}" = ".github.com." ]; then
# 	/home/viiksipo/github/checkout.sh
# fi
# /rikki

echo $(date -u +'%Y-%m-%d %H:%M:%S') $REMOTE_ADDR >> $LOGFILE

if dig -x $REMOTE_ADDR | grep 'github.com. ' > /dev/null ; then # paskempi mut sinne päin ^___^
	/home/viiksipo/github/checkout.sh
fi

# RESPONSE
echo "Content-type: text/html"
echo 
echo LAZER BEAMS ABLAZE
