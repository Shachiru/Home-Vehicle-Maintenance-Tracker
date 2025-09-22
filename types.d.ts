// Global type declarations for Istanbul packages
// These are being used implicitly by a testing framework and need stubs

/**
 * @packageDocumentation
 * @module istanbul-lib-report
 */
declare module "istanbul-lib-report" {
  export interface ReportBase {}
  export interface Context {}
  export interface ReportNode {}
  export interface Visitor {}
  export interface ReportClass {}
}

/**
 * @packageDocumentation
 * @module istanbul-reports
 */
declare module "istanbul-reports" {
  export interface ReportOptions {}
  export function create(name: string, options?: any): any;
  export function getDefaultWatermarks(): { [key: string]: number[] };
}
