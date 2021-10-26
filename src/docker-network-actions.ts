import { Red, Node } from 'node-red';
import { DockerConfiguration } from './docker-configuration';
import * as Dockerode from 'dockerode';

module.exports = function (RED: Red) {

    function DockerNetworkAction(n: any) {
        RED.nodes.createNode(this, n);
        let config = RED.nodes.getNode(n.config) as unknown as DockerConfiguration;
        let client = config.getClient();
        this.on('input', (msg) => {

            let networkId: string = n.network || msg.payload.networkId || msg.networkId || undefined;
            let action = n.action || msg.action || msg.payload.action || undefined;
            let options = n.options || msg.options || msg.payload.options || undefined;

            if (networkId === undefined && !['list', 'prune', 'create'].includes(action)) {
                this.error("Network id/name must be provided via configuration or via `msg.network`");
                return;
            }
            this.status({});
            executeAction(networkId, options, client, action, this,msg);
        });

        function executeAction(networkId: string, options: any, client: Dockerode, action: string, node: Node,msg) {

            let network = client.getNetwork(networkId);

            switch (action) {

                case 'list':
                    // https://docs.docker.com/engine/api/v1.40/#operation/NetworkList
                    client.listNetworks({ all: true })
                        .then(res => {
                            node.status({ fill: 'green', shape: 'dot', text: networkId + ' started' });
                            node.send(Object.assign(msg,{ payload: res }));
                        }).catch(err => {
                            if (err.statusCode === 400) {
                                node.error(`Bad parameter:  ${err.reason}`);
                                node.send({ payload: err });
                            } else if (err.statusCode === 500) {
                                node.error(`Server Error: [${err.statusCode}] ${err.reason}`);
                                node.send({ payload: err });
                            } else {
                                node.error(`System Error:  [${err.statusCode}] ${err.reason}`);
                                return;
                            }
                        });
                    break;

                case 'inspect':
                    // https://docs.docker.com/engine/api/v1.40/#operation/NetworkInspect
                    network.inspect()
                        .then(res => {
                            node.status({ fill: 'green', shape: 'dot', text: networkId + ' started' });
                            node.send(Object.assign(msg,{ payload: res }));
                        }).catch(err => {
                            if (err.statusCode === 500) {
                                node.error(`Server Error: [${err.statusCode}] ${err.reason}`);
                                node.send({ payload: err });
                            } else {
                                node.error(`System Error:  [${err.statusCode}] ${err.reason}`);
                                return;
                            }
                        });
                    break;

                case 'remove':
                    // https://docs.docker.com/engine/api/v1.40/#operation/NetworkRemove
                    network.remove()
                        .then(res => {
                            node.status({ fill: 'green', shape: 'dot', text: networkId + ' remove' });
                            node.send(Object.assign(msg,{ payload: res }));
                        }).catch(err => {
                            if (err.statusCode === 500) {
                                node.error(`Server Error: [${err.statusCode}] ${err.reason}`);
                                node.send({ payload: err });
                            } else {
                                node.error(`System Error:  [${err.statusCode}] ${err.reason}`);
                                return;
                            }
                        });
                    break;

                case 'connect':
                    // https://docs.docker.com/engine/api/v1.40/#operation/NetworkConnect
                    network.connect()
                        .then(res => {
                            node.status({ fill: 'green', shape: 'dot', text: networkId + ' remove' });
                            node.send(Object.assign(msg,{ payload: res }));
                        }).catch(err => {
                            if (err.statusCode === 500) {
                                node.error(`Server Error: [${err.statusCode}] ${err.reason}`);
                                node.send({ payload: err });
                            } else {
                                node.error(`System Error:  [${err.statusCode}] ${err.reason}`);
                                return;
                            }
                        });
                    break;

                case 'disconnect':
                    // https://docs.docker.com/engine/api/v1.40/#operation/NetworkDisconnect
                    network.disconnect()
                        .then(res => {
                            node.status({ fill: 'green', shape: 'dot', text: networkId + ' remove' });
                            node.send(Object.assign(msg,{ payload: res }));
                        }).catch(err => {
                            if (err.statusCode === 500) {
                                node.error(`Server Error: [${err.statusCode}] ${err.reason}`);
                                node.send({ payload: err });
                            } else {
                                node.error(`System Error:  [${err.statusCode}] ${err.reason}`);
                                return;
                            }
                        });
                    break;

                case 'prune':
                    // https://docs.docker.com/engine/api/v1.40/#operation/NetworkPrune
                    client.pruneImages()
                        .then(res => {
                            node.status({ fill: 'green', shape: 'dot', text: networkId + ' remove' });
                            node.send(Object.assign(msg,{ payload: res }));
                        }).catch(err => {
                            if (err.statusCode === 500) {
                                node.error(`Server Error: [${err.statusCode}] ${err.reason}`);
                                node.send({ payload: err });
                            } else {
                                node.error(`System Error:  [${err.statusCode}] ${err.reason}`);
                                return;
                            }
                        });
                    break;
                case 'create':
                    // https://docs.docker.com/engine/api/v1.40/#operation/NetworkCreate
                    client.createNetwork(options)
                        .then(res => {
                            node.status({ fill: 'green', shape: 'dot', text: networkId + ' remove' });
                            node.send(Object.assign(msg,{ payload: res }));
                        }).catch(err => {
                            if (err.statusCode === 500) {
                                node.error(`Server Error: [${err.statusCode}] ${err.reason}`);
                                node.send({ payload: err });
                            } else {
                                node.error(`System Error:  [${err.statusCode}] ${err.reason}`);
                                return;
                            }
                        });
                    break;
                
                default:
                    node.error(`Called with an unknown action: ${action}`);
                    return;
            }
        }
    }

    RED.httpAdmin.post("/networkSearch", function (req, res) {
        RED.log.debug("POST /networkSearch");

        const nodeId = req.body.id;
        let config = RED.nodes.getNode(nodeId);

        discoverSonos(config, (networks) => {
            RED.log.debug("GET /networkSearch: " + networks.length + " found");
            res.json(networks);
        });
    });

    function discoverSonos(config, discoveryCallback) {
        let client = config.getClient();
        client.listNetworks({ all: true })
            .then(networks => discoveryCallback(networks))
            .catch(err => this.error(err));
    }
    
    RED.nodes.registerType('docker-network-actions', DockerNetworkAction);
}

