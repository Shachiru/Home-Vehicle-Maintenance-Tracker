// This file suppresses TypeScript errors for missing type definition files
// istanbul-lib-report and istanbul-reports are often used by testing frameworks

/// <reference no-default-lib="true"/>

interface NodeRequire {
  (id: string): any;
}

interface NodeModule {
  exports: any;
  require: NodeRequire;
  id: string;
  filename: string;
  loaded: boolean;
  parent: NodeModule | null;
  children: NodeModule[];
  paths: string[];
}

declare var module: NodeModule;

declare module "istanbul-lib-report" {}
declare module "istanbul-reports" {}
