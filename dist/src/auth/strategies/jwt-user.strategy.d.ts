import { Strategy } from "passport-jwt";
declare const JwtUserStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtUserStrategy extends JwtUserStrategy_base {
    constructor();
    validate(payload: {
        sub: string;
        role: string;
    }): {
        userId: string;
        role: string;
    };
}
export {};
