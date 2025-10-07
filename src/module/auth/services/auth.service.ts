/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../user/entities/user.entity';
import { Role } from '../../user/entities/role.entity';
import { UserRole } from '../../user/entities/user-role.entity';
import { RegisterDto } from '../dtos/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Role)
    private rolesRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private userRolesRepo: Repository<UserRole>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      password: hashed,
    });

    const saved = await this.usersRepo.save(user);
    // auto-assign ROLE_USER if exists
    try {
      const role = await this.rolesRepo.findOne({
        where: { roleName: 'ROLE_USER' },
      });
      if (role) {
        await this.userRolesRepo.save(
          this.userRolesRepo.create({ userId: saved.id, roleId: role.id }),
        );
      }
    } catch (e) {
      // seeding might not have run yet or roles table missing; ignore
    }
    // reload user with roles
    const reloaded = await this.usersRepo.findOne({
      where: { id: saved.id },
      relations: ['roles', 'roles.role'],
    });
    const token = this.jwtService.sign({ sub: saved.id, email: saved.email });
    // omit password and map roles
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...profile } = reloaded as any;
    const roleNames = (reloaded?.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean);
    return { user: { ...profile, roles: roleNames }, accessToken: token };
  }

  async validateUserByEmail(email: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: pw, ...profile } = user as any;
    return profile as any;
  }

  async login(dto: LoginDto) {
    let user: User | null = null;
    if (dto.email) {
      user = await this.usersRepo.findOne({
        where: { email: dto.email },
        relations: ['roles', 'roles.role'],
      });
    } else if (dto.phone) {
      user = await this.usersRepo.findOne({
        where: { phone: dto.phone },
        relations: ['roles', 'roles.role'],
      });
    }
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...profile } = user as any;
    const roleNames = (user.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean);
    return { user: { ...profile, roles: roleNames }, accessToken: token };
  }
}
