import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";

/**
 * Google OAuth2 strategy for the web flow.
 * Used by GET /auth/agent/google and GET /auth/agent/google/callback
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_CALLBACK_URL  (e.g. https://api.okapi.immo/auth/agent/google/callback)
 */
@Injectable()
export class GoogleAgentStrategy extends PassportStrategy(Strategy, "google-agent") {
  constructor() {
    super({
      clientID:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:3000/auth/agent/google/callback",
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      displayName: string;
      emails?: { value: string }[];
      photos?: { value: string }[];
    },
    done: VerifyCallback,
  ): Promise<void> {
    const { id, displayName, emails, photos } = profile;
    const user = {
      googleId:  id,
      name:      displayName,
      email:     emails?.[0]?.value ?? null,
      photo:     photos?.[0]?.value ?? null,
    };
    done(null, user);
  }
}
