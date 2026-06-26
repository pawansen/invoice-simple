import { ApiProperty } from '@nestjs/swagger';

/** Public-safe representation of a user (no password hash). */
export class UserProfileDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'admin@simpleinvoice.io' })
  email: string;

  @ApiProperty({ example: 'Demo Admin' })
  fullname: string;
}

/** Response body for POST /auth/login. */
export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token (Bearer)' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ description: 'Token lifetime in seconds', example: 3600 })
  expiresIn: number;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
