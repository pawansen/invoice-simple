import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Request body for POST /auth/login. */
export class LoginDto {
  @ApiProperty({ example: 'admin@simpleinvoice.io', description: 'Registered email address' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Account password' })
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  @MaxLength(255)
  password: string;
}
