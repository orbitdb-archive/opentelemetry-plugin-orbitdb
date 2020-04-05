"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@opentelemetry/core");
const utils_1 = require("./utils");
const shimmer = __importStar(require("shimmer"));
class OrbitDBPlugin extends core_1.BasePlugin {
    constructor(moduleName) {
        super('@opentelemetry/plugin-orbitdb', '1.0.0');
        this.moduleName = moduleName;
        this.supportedVersions = ['^0.23.0'];
    }
    patch() {
        const patchedOrbit = this._moduleExports;
        if (patchedOrbit) {
            this._logger.debug('Patching OrbitDB.createInstance');
            shimmer.wrap(patchedOrbit, 'createInstance', this._getPatchCreateInstanceCommand());
            this._logger.debug('patching OrbitDB.prototype._onPeerConnected');
            shimmer.wrap(patchedOrbit.prototype, '_onPeerConnected', this._getPatchOnPeerConnectedCommand());
            this._logger.debug('patching OrbitDB.prototype.disconnect');
            shimmer.wrap(patchedOrbit.prototype, 'disconnect', this._getPatchDisconnectCommand());
        }
        return patchedOrbit;
    }
    unpatch() {
        const patchedOrbit = this._moduleExports;
        if (patchedOrbit) {
            shimmer.unwrap(patchedOrbit, 'createInstance');
            shimmer.unwrap(patchedOrbit.prototype, '_onPeerConnected');
            shimmer.unwrap(patchedOrbit.prototype, 'disconnect');
        }
    }
    _getPatchCreateInstanceCommand() {
        const tracer = this._tracer;
        return function createInstance(original) {
            return utils_1.getTracedCreateInstanceCommand(tracer, original);
        };
    }
    _getPatchOnPeerConnectedCommand() {
        const tracer = this._tracer;
        return function _onPeerConnected(original) {
            return utils_1.getTracedOnPeerConnectedCommand(tracer, original);
        };
    }
    _getPatchDisconnectCommand() {
        const tracer = this._tracer;
        return function disconnect(original) {
            return utils_1.getTracedDisconnectCommand(tracer, original);
        };
    }
}
exports.OrbitDBPlugin = OrbitDBPlugin;
OrbitDBPlugin.COMPONENT = 'orbit-db';
exports.plugin = new OrbitDBPlugin(OrbitDBPlugin.COMPONENT);
//# sourceMappingURL=orbitdb.js.map