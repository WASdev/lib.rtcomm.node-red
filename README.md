#lib.rtcomm.node-red

This repository contains all of the 'rtcomm' node-red nodes. These nodes interface to Rtcomm services through an MQTT message broker running on a WebSphere Liberty server running the rtcomm-1.0 feature. The services enables by these nodes includes:

1. Event monitoring of Rtcomm services.
2. Third party call control (the ability to initiate a 3rd party call).

The nodes rely on node-red (http://nodered.org/).

##Install

Run the following command in the root directory of your Node-RED install

```
npm install node-red-contrib-rtcomm
```
