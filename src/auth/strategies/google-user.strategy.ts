import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";

export interface GoogleUserProfile {
  googleId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  photo: string | null;
}

@Injectable()
export class GoogleUserStrategy extends PassportStrategy(Strategy, "google-user") {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.GOOGLE_USER_CALLBACK_URL ??
        "http://localhost:8080/auth/google/callback",
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: any, user: any) => void,
  ) {
    const displayName: string = profile.displayName ?? "";
    const spaceIdx = displayName.indexOf(" ");
    const firstName =
      spaceIdx > -1 ? displayName.slice(0, spaceIdx) : displayName;
    const lastName =
      spaceIdx > -1 ? displayName.slice(spaceIdx + 1) : "";

    const user: GoogleUserProfile = {
      googleId:  profile.id,
      firstName,
      lastName,
      email:     profile.emails?.[0]?.value ?? null,
      photo:     profile.photos?.[0]?.value ?? null,
    };
    done(null, user);
  }
}
