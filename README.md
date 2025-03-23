# node-red-contrib-ui-countdown-timer-switch
A node-red-ui countdown timer switch for the Node-RED Dashboard.  
___
### NOTE: - This project is based on Angular v1 and node-red-dashboard - as both projects are now no longer maintained, this project should be considered to be deprecated as well.
___
![](images/cts.png)

## Install
  
You can install this node directly from the "Manage Palette" menu in the Node-RED interface.  
Alternatively, run the following command in your Node-RED user directory - typically `~/.node-red` on Linux or `%HOMEPATH%\.nodered` on Windows

        npm install node-red-contrib-ui-countdown-timer-switch

### Requirements ###
node-red v0.19 or above  
node-red-dashboard v2.10.0 (v2.15.4 or above would be ideal)

## Usage
  
Add a countdown-timer-switch-node to your flow. Open the dashboard, by default you will see four buttons.
Each button has a label with a number that indicates how long the switch stays on (in minutes). Click one of
those buttons and the switch will be on for the specific amount of time.

### Input

The countdown can be activated via an incoming message if it has a property countdown.
The value of msg.countdown must be a number in minutes. The switch will stay on for
the specified amount of time. A msg.countdown with a value of 0 turns the switch off.

### Size

You can leave it with a grid size of 'auto' but if you want to change that make sure it's at least 5x2 (you can make it smaller if you don't mind scrollbars though). 

## History
  
Find the changelog [here](CHANGELOG.md).
  
# Donate
  
You can donate by clicking the following link if you want to support this free project:
  
<a target="blank" href="https://www.paypal.me/fellinga"><img src="https://img.shields.io/badge/Donate-PayPal-blue.svg"/></a>
