import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

export enum ExperienceRange {
  LESS_THAN_1 = "LESS_THAN_1",
  ONE_TO_3 = "ONE_TO_3",
  THREE_TO_5 = "THREE_TO_5",
  FIVE_PLUS = "FIVE_PLUS",
}

export class SubmitIdentityDto {
  @IsDateString() dateOfBirth: string;
  @IsString() nationalIdNumber: string;
  @IsString() idDocumentUrl: string;
  @IsString() selfieUrl: string;
  @IsOptional() @IsString() residenceCommune?: string;
  @IsOptional() @IsEnum(ExperienceRange) experienceRange?: ExperienceRange;
}
