import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

/** Default JWT lifetime (seconds) when JWT_EXPIRES_IN is not configured. */
const DEFAULT_JWT_EXPIRES_IN = 3600;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Verify credentials and return the user on success. A single generic error
   * is used for both "unknown email" and "wrong password" so the API does not
   * reveal which accounts exist.
   */
  private async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  /** Authenticate a user and issue a signed JWT access token. */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateCredentials(dto.email, dto.password);

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const expiresIn = this.configService.get<number>(
      'JWT_EXPIRES_IN',
      DEFAULT_JWT_EXPIRES_IN,
    );

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: { id: user.id, email: user.email, fullname: user.fullname },
    };
  }
}
