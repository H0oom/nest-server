import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  @IsNumber()
  target_user_id: number;
}
