#lib.rtcomm.node-red

This repository contains all of the 'rtcomm' node-red nodes. These nodes work with WebSphere Liberty Rtcomm services through an MQTT message broker. The following nodes are included:

1. Rtcomm session monitoring.
2. Rtcomm presence monitoring.
3. Third party call control (the ability to initiate a 3rd party call).

The nodes rely on node-red (http://nodered.org/).

##Install

Run the following command in the root directory of your Node-RED install

```
npm install node-red-contrib-rtcomm

Note: specific releases of this repository can be installed via the following command:
npm install node-red-contrib-rtcomm@<version>

See the wiki page for what versions have been tested with specific versions of the 
WebSphere Liberty profile.
```
