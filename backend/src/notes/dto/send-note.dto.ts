import { IsEmail } from "class-validator";

export class SendNoteDto {
  @IsEmail()
  email: string;
}
