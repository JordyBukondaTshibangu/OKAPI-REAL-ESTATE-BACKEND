import { Strategy } from "passport-jwt";
declare const JwtAgentStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtAgentStrategy extends JwtAgentStrategy_base {
    constructor();
    validate(payload: {
        sub: string;
        role: string;
    }): {
        agentId: string;
        role: string;
    };
}
export {};
