/**
 * Copyright 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Require main module
module.exports = function(RED) {
  "use strict";
  
  var rtcommRtcConnector = require('rtcomm').RtcConnector;

   // The rtcomm RtcConnector node definition
  function RtcommRtcConnectorNode(n) {
      RED.nodes.createNode(this,n);
      this.topic = n.topic || '/rtcomm/event';
      this.broker = n.broker;
      this.brokerConfig = RED.nodes.getNode(this.broker);
      this.rtcConnector = null;

  //	This defines the event filter
      this.registration = n.registration || false;
      this.session = n.session || false;
      this.started = n.started || false;
      this.failed = n.failed || false;
      this.modified = n.modified || false;
      this.stopped = n.stopped || false;
      this.fromEndpoint = n.fromendpoint;
      this.toEndpoint = n.toendpoint;
      var unique = n.unique || false;

      var node = this;
      if (this.brokerConfig) {
         this.status({fill:"red",shape:"ring",text:"disconnected"});
        //this.client = connectionPool.get(this.brokerConfig.broker,this.brokerConfig.port,this.brokerConfig.clientid,this.brokerConfig.username,this.brokerConfig.password);
        var config = {
          'server': this.brokerConfig.broker,
          'port': this.brokerConfig.port,
           'eventPath': this.topic,
           'unique': unique};
        var rtcConnector = this.rtcConnector = rtcommRtcConnector.get(config);
        rtcConnector.on('connected',function(){
            node.log('connected');
            node.status({fill:"green",shape:"dot",text:"connected"});
        });
        rtcConnector.on('disconnected',function(){
            node.log('disconnected');
            node.status({fill:"red",shape:"ring",text:"disconnected"});
        });
        rtcConnector.on('error',function(){
            node.log('error');
            node.status({fill:"red",shape:"ring",text:"error"});
        });

        // Start the monitor
        rtcConnector.start();

        // Filter Callback
        var processMessage = function processMessage(topic, message) {
          var msg = {};
          //node.log('.processMessage('+topic+')+ '+message);
          try {
            msg.payload = JSON.parse(message);
          } catch(e) {
            node.error("Message cannot be parsed as an Object: "+message);
          }
          var match = /\/(session|registration)\/(started|stopped|modified|failed)\/(.+$)/.exec(topic);
          if (match &&
              typeof msg.payload === 'object' &&
              msg.payload.method === 'RTCOMM_EVENT_FIRED' ) {
            //console.log('MATCH ARRAY'+match);
            msg.topic = topic;
            msg.payload.category = match[1] || 'unknown';
            msg.payload.action = match[2]|| 'unknown';

            var m = /\//.test(match[3]) ? /(.+)\/(.+)/.exec(match[3]) : [null, match[3], null];
            msg.payload.fromendpointid = m[1] || 'unknown';
            if (m[2]) { 
              msg.payload.toendpointid = m[2];
            }

          } else {
            node.error('Unable to form message for topic:'+topic+' and message: '+message); 
            msg = null;
          }
          node.send(msg);
        };
        this.filter = rtcConnector.addFilter({
          'category': {
            'session': this.session, 
            'registration':this.registration },
           'action': {
             'started':this.started,
             'modified':this.modified,
             'stopped':this.stopped, 
             'failed':this.failed },
           'toendpointid': this.toEndpoint,
           'fromendpointid':this.fromEndpoint},
           processMessage);

        this.log('Added Filter - '+this.filter.subscriptions);
      } else {
        this.error("missing broker configuration");
      }
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("rtcomm conn",RtcommRtcConnectorNode);
	
    RtcommRtcConnectorNode.prototype.close = function() {
        if (this.filter) {
          this.rtcConnector.removeFilter(this.filter);
        }
        this.rtcConnector.stop();
    };

    var rtcomm3PCC = require('rtcomm').ThirdPartyCC;
    
    /*
     * Generate a Random UUID
     */ 
    var generateUUID = function generateUUID() {
        /*jslint bitwise: true */
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c==='x' ? r : (r&0x7|0x8)).toString(16);
        }); 
        return uuid;
    };

	var transList = {};

    // The 3PCC node definition
	function Rtcomm3PCCNode(n) {
        RED.nodes.createNode(this,n);
        this.topic = n.topic || '/rtcomm/ThirdPartyCC';
        this.broker = n.broker;
        this.brokerConfig = RED.nodes.getNode(this.broker);
        this.thirdPCC = null;

        var node = this;
        if (this.brokerConfig) {
           this.status({fill:"red",shape:"ring",text:"disconnected"});

           var config = {
            'server': this.brokerConfig.broker,
            'port': this.brokerConfig.port,
            'topic': this.topic};
          
          var thirdPCC = this.thirdPCC = rtcomm3PCC.get(config,function(message){
        	  							var nodeRedMsg;
        	  							var transID = message.transID;
        	  							var trans = transList[transID];
        	  							
        	  							if (trans == null)
        	  							{
        	  								node.error("ERROR: Unknown transID received from nodeModule");
        	  								return;
        	  							}
        	  							
        	  							if (message.result == 'SUCCESS')
        	  							{
											node.log('3PCC call INITIATED successfully');
    	  									nodeRedMsg = {'payload' : {
    	  													'result' : 'SUCCESS',
    	  													'callerEndpointID' : trans.callerEndpointID,
    	  													'calleeEndpointID' : trans.calleeEndpointID,
    	  													'sigSessionID' : trans.sigSessionID}
    	  												};
        	  							}
        	  							else
        	  							{
											node.error('3PCC call FAILED with reason:' + message.reason);
    	  									nodeRedMsg = {'payload' : {
													'result' : 'FAILURE',
													'reason' : message.reason,
													'callerEndpointID' : trans.callerEndpointID,
													'calleeEndpointID' : trans.calleeEndpointID,
													'sigSessionID' : trans.sigSessionID}
											};
        	  							}
        	  							node.send(nodeRedMsg);
									}.bind(this));
          
		  thirdPCC.on('connected',function(){
              node.log('connected');
              node.status({fill:"green",shape:"dot",text:"connected"});
          });
          thirdPCC.on('disconnected',function(){
              node.log('disconnected');
              node.status({fill:"red",shape:"ring",text:"disconnected"});
          });

          this.on('input', function(msg) {
            if (typeof msg.payload === 'object') {

            	if (msg.payload.callerEndpointID && msg.payload.calleeEndpointID){
					node.log('.input callerEndpointID:'+msg.payload.callerEndpointID);
					node.log('.input calleeEndpointID:'+msg.payload.calleeEndpointID);
					
					var sigSessionID = null;
					if (msg.payload.sigSessionID)
						sigSessionID = msg.payload.sigSessionID;
			  
					var transID = generateUUID();
					transList[transID] = {
									'callerEndpointID': msg.payload.callerEndpointID,
									'calleeEndpointID': msg.payload.calleeEndpointID,
									'sigSessionID' : sigSessionID
									};
						
					//	FIX: Currently passing in null for session ID. Should allow this to be input on the node.
					this.thirdPCC.startCall(msg.payload.callerEndpointID,msg.payload.calleeEndpointID, sigSessionID, transID);
            	}
            	else{
                   	node.error('msg.payload does not include callerEndpointID or calleeEndpointID: ' +  msg); 
            	}
			}
			else {
              node.error('msg.payload is not an Object. Unable to create 3PCC for: '+ msg); 
            }
		  }.bind(this));
		  
		  // Start the 3PCC Node
          thirdPCC.start();
        } else {
          this.error("missing broker configuration");
        }
      }

      // Register the node by name. This must be called before overriding any of the
      // Node functions.
      RED.nodes.registerType("rtcomm 3PCC",Rtcomm3PCCNode);
      Rtcomm3PCCNode.prototype.close = function() {
          this.thirdPCC.stop();
      };
  };
