/*
MIT License

Copyright (c) 2020 Mario Fellinger

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

module.exports = function(RED) {
	'use strict';

	function HTML(config) {
		const uniqueId = config.id.replace(".", "");
		const divPrimary = "ui-cts-" + uniqueId;
	
		const styles = String.raw`
		<style>
			#` + divPrimary + ` {
				height:125px;
				padding: 0 2px 0 6px;
				overflow-x: hidden;
			}
			#` + divPrimary + ` .md-button {
				margin: 0 5px 0 0;
				width: 100%;
				min-width: 36px;
				height: 36px;
			}
		</style>`
		;

		const timerBody = String.raw`
		<div id="` + divPrimary + `" ng-init='init(` + JSON.stringify(config) + `)'>
			<div layout="row" layout-align="space-between center" style="max-height: 50px;">
				<div flex="80" layout="row">
					<md-button ng-repeat="countdown in countdowns" aria-label="start" ng-click="buttonPressed(countdown)"> {{countdown}} </md-button>
				</div>
				<div flex="20" layout="row" layout-align="end center">
					<md-switch aria-label="switch" ng-change="switchChanged(switchState)" ng-model="switchState" ng-disabled="${config.disableSwitch}"> </md-switch>
				</div>
			</div>
			<div layout="row" style="max-height: 60px;">
				<md-input-container flex="50" ng-show="started">
					<label style="color: var(--nr-dashboard-widgetTextColor)">` + RED._("countdown-timer-switch.ui.startedAt") + `</label>
					<input id="startsAt-` + uniqueId + `" value="00:00:00" type="time" disabled required md-no-asterisk step="1" style="color: var(--nr-dashboard-widgetTextColor)">
					<span class="validity"></span>
				</md-input-container>
				<md-input-container flex="50" ng-show="ends">
					<label style="color: var(--nr-dashboard-widgetTextColor)">` + RED._("countdown-timer-switch.ui.endsAt") + `</label>
					<input id="endsAt-` + uniqueId + `" value="00:00:00" type="time" disabled required md-no-asterisk step="1" style="color: var(--nr-dashboard-widgetTextColor)">
					<span class="validity"></span>
				</md-input-container>
			</div>
		</div>
		`;

		const html = String.raw`
		${styles}
		${timerBody}`
		return html;
	}

	function checkConfig(config, node) {
		if (!config) {
		  node.error(RED._("ui_countdown_timer_switch.error.no-config"));
		  return false;
		}
		if (!config.hasOwnProperty("group")) {
		  node.error(RED._("ui_countdown_timer_switch.error.no-group"));
		  return false;
		}
		return true;
	}

    function CountdownTimerSwitchNode(config) {
		try {
			let ui = undefined;
			if(ui === undefined) {
				ui = RED.require("node-red-dashboard")(RED);
			}

			RED.nodes.createNode(this,config);
			const node = this;
			let timeout = null;
			let currentState = {started : null, ends: null, switchState: false};

			this.getStateCallback = function getStateCallback(req, res) {
				res.send(currentState);
			}

			this.setTimoutCallback = function setTimoutCallback(req, res) {
				node.send({payload: setStatus(true)});
				currentState.ends = currentState.started + Number(req.params.value);
				res.end();

				timeout = setTimeout(function() {
					node.send({payload: setStatus(false)});
				}, currentState.ends - new Date().getTime());
			}

			function setStatus(value) {
				if (timeout) clearTimeout(timeout);

				if (value) {
					currentState.started = new Date().getTime();
					currentState.switchState = value;
					node.status({fill: "green", shape: "dot", text: "on" });
				} else {
					currentState.started = null;
					currentState.ends = null;
					currentState.switchState = value;
					node.status({fill: "red", shape: "ring", text: "off" });
				}
				
				const payload = value ? config.onvalue : config.offvalue;
				const payloadType = value ? config.onvalueType : config.offvalueType;
				
				if (payloadType === "date") value = Date.now();
				else value = RED.util.evaluateNodeProperty(payload,payloadType,node);

				return value; 
			}
			
			if (checkConfig(config, node)) {
				const done = ui.addWidget({
					node: node,
					format: HTML(config),
					templateScope: "local",
					group: config.group,
					order: config.order,
					emitOnlyNewValues: false,
					forwardInputMessages: false,
					storeFrontEndInputAsState: true,
					persistantFrontEndValue : true,
					beforeEmit: function (msg, value) {
						if (value === RED.util.evaluateNodeProperty(config.onvalue,config.onvalueType,node)) {
							setStatus(true);
							node.send(msg);
						} else if (value === RED.util.evaluateNodeProperty(config.offvalue,config.offvalueType,node)) {
							setStatus(false);
							node.send(msg);
						}
						
						return {msg: msg};
					},
					beforeSend: function (msg, orig) {
						if (orig && orig.msg) {
							if (orig.msg.payload === "updateUis") {
								delete orig.msg.payload;
								return [null];
							}
							orig.msg.payload = setStatus(orig.msg.payload);
							return orig.msg;
						}
					},
					initController: function ($scope) {
						$scope.init = function (config) {
							$scope.nodeId = config.id;
							$scope.countdowns = config.countdowns;
						}

						$scope.$watch('msg', function() {
							$scope.getState();
						});

						$scope.buttonPressed = function(minutes) {
							$scope.setServerTimeout(minutes*60*1000);
						}

						$scope.switchChanged = function(switchState) {
							$scope.sendPayload(switchState);
						  };

						$scope.sendPayload = function(payload) {
							if ($scope.msg) $scope.msg.payload = payload;
							else $scope.msg = {payload: payload};
							$scope.send($scope.msg);
						}

						$scope.getState = function() {
							$.ajax({
								url: "countdown-timer-switch/getNode/" + $scope.nodeId,
								dataType: 'json',
								async: true,
								success: function(json) {
									$scope.setState(json);
								},
								complete: function() {
									$scope.$digest();
								}
							});
						}

						$scope.setState = function(json) {
							$scope.started = json.started;
							$scope.ends = json.ends;
							$scope.switchState = json.switchState;

							if ($scope.started) {
								$scope.getElement("startsAt").value = new Date($scope.started).toLocaleTimeString("en-GB");
							}
							if ($scope.ends) {
								$scope.getElement("endsAt").value = new Date($scope.ends).toLocaleTimeString("en-GB");
								clearTimeout($scope.localTimeout);
								$scope.localTimeout = setTimeout($scope.getState, $scope.ends - new Date().getTime());
							}
						}

						$scope.setServerTimeout = function(millis) {
							$.ajax({
								url: "countdown-timer-switch/getNode/" + $scope.nodeId + "/" + millis,
								dataType: 'json',
								async: true,
								complete: function() {
									$scope.send({payload: "updateUis"});
								}
							});
						}

						$scope.getElement = function(elementId) {
							return document.querySelector("#" + elementId + "-" + $scope.nodeId.replace(".", ""));
						}
					}
				});

				node.on("close", function() {
					if (done) {
						clearTimeout(timeout);
						done();
					}
				});
			}
		} catch(error) {
			console.log("CountdownTimerSwitchNode:", error);
		}
    }
	RED.nodes.registerType("ui_countdown_timer_switch",CountdownTimerSwitchNode);

	const uiPath = ((RED.settings.ui || {}).path) || 'ui';
	let nodePath = '/' + uiPath + '/countdown-timer-switch/getNode/:nodeId';
	nodePath = nodePath.replace(/\/+/g, '/');

	RED.httpNode.get(nodePath, function(req, res) {
		const nodeId = req.params.nodeId;
		const node = RED.nodes.getNode(nodeId);
		node ? node.getStateCallback(req, res) : res.send(404).end();
	});

	RED.httpNode.get(nodePath + "/:value", function(req, res) {
		const nodeId = req.params.nodeId;
		const node = RED.nodes.getNode(nodeId);
		node ? node.setTimoutCallback(req, res) : res.send(404).end();
	});
}