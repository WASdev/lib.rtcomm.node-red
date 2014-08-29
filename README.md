#lib.rtcomm.node-red

This repository contains all of the 'rtcomm' node-red nodes. These nodes interface to Rtcomm services through an MQTT message broker running on a WebSphere Liberty server running the rtcomm-1.0 feature. The services enables by these nodes includes:

1. Event monitoring of Rtcomm services.
2. Third party call control (the ability to initiate a 3rd party call).

The nodes rely on node-red (http://nodered.org/).

##Install

Run the following command in the root directory of your Node-RED install

```
npm install node-red-contrib-rtcomm

Note: specific releases of this repository can be installed via the following command:
npm install node-red-contrib-rtcomm@<version>

See the wiki page for what versions have been tested with specific versions of the WebSphere Liberty profile.
```
