export interface BlenderStatus {
  isInstalled: boolean;
  version?: string;
  path?: string;
}

export interface BlenderPluginStatus {
  isInstalled: boolean;
  version?: string;
}

export enum BlenderState {
  CHECKING = "checking",
  NOT_FOUND = "not_found",
  FOUND = "found",
  PLUGIN_MISSING = "plugin_missing", 
  READY = "ready",
  LAUNCHING = "launching"
}