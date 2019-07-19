#!/bin/bash
#DISPLAY=:0.0 XAUTHORITY=~/.Xauthority notify-send "$1" -t 86400000
DISPLAY=:0.0 XAUTHORITY=~/.Xauthority kdialog \
   --passivepopup "$1" 86400000 \
   --title "New Mail" \
   --icon ""