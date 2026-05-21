import { Strategy } from "passport-jwt";
declare const JwtAdminStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtAdminStrategy extends JwtAdminStrategy_base {
    constructor();
    validate(payload: {
        sub: string;
        role: string;
    }): {
        adminId: string;
        role: string;
    };
}
export {};
