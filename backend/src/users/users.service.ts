import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

/**
 * Data access for users. Kept deliberately small for this assessment: lookups
 * needed by authentication. The password hash is excluded from queries by
 * default (column `select: false`); `findByEmailWithPassword` explicitly opts
 * in for credential verification only.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /** Find a user by id (without the password hash). Used by JWT validation. */
  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * Find a user by email INCLUDING the password hash. Used only during login to
   * verify credentials; the returned hash must never be serialised to a client.
   */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }
}
