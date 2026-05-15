import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;
  @IsString() phoneNumber: string;
  @IsString() @MinLength(6) password: string;
}
