import { BasePlugin } from '@opentelemetry/core';
import * as OrbitDBTypes from 'orbit-db';
import {
  getTracedCreateInstanceCommand,
  getTracedOnPeerConnectedCommand
} from './utils';
import * as shimmer from 'shimmer';

export class OrbitDBPlugin extends BasePlugin<typeof OrbitDBTypes.OrbitDB> {
    static readonly COMPONENT = 'orbit-db';
    readonly supportedVersions = ['^0.23.0'];

    constructor(readonly moduleName: string) {
        super('@opentelemetry/plugin-orbitdb', '1.0.0');
    }

    protected patch() {
        const patchedOrbit = this._moduleExports;

        if (patchedOrbit) {
            this._logger.debug('Patching orbit-db.OrbitDB.createInstance');
            shimmer.wrap(
              patchedOrbit,
              'createInstance',
              this._getPatchCreateInstanceCommand()
            );
      
            this._logger.debug('patching OrbitDB.prototype._onPeerConnected');
            shimmer.wrap(
              patchedOrbit.prototype,
              '_onPeerConnected',
              this._getPatchOnPeerConnectedCommand()
            );
      
            // this._logger.debug('patching redis.createClient');
            // shimmer.wrap(
            //   this._moduleExports,
            //   'createClient',
            //   this._getPatchCreateClient()
            // );
          }
          return patchedOrbit;
    }

    protected unpatch() {
      const patchedOrbit = this._moduleExports;

      if (patchedOrbit) {
        shimmer.unwrap(patchedOrbit, 'createInstance');
        shimmer.unwrap(patchedOrbit.prototype, '_onPeerConnected');
      }
    }

    private _getPatchCreateInstanceCommand() {
      const tracer = this._tracer;
      return function createInstance(original: Function) {
        return getTracedCreateInstanceCommand(tracer, original);
      };
    }

    private _getPatchOnPeerConnectedCommand() {
      const tracer = this._tracer;
      return function _onPeerConnected(original: Function) {
        return getTracedOnPeerConnectedCommand(tracer, original);
      };
    }
}

export const plugin = new OrbitDBPlugin(OrbitDBPlugin.COMPONENT);