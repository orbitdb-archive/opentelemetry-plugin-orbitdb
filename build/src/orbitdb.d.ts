import { BasePlugin } from '@opentelemetry/core';
import * as OrbitDBTypes from 'orbit-db';
export declare class OrbitDBPlugin extends BasePlugin<typeof OrbitDBTypes.OrbitDB> {
    readonly moduleName: string;
    static readonly COMPONENT = "orbit-db";
    readonly supportedVersions: string[];
    constructor(moduleName: string);
    protected patch(): typeof OrbitDBTypes.OrbitDB;
    protected unpatch(): void;
    private _getPatchCreateInstanceCommand;
    private _getPatchOnPeerConnectedCommand;
    private _getPatchDisconnectCommand;
}
export declare const plugin: OrbitDBPlugin;
