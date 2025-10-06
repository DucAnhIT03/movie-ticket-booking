import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserRole } from './user-role.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'role_name', type: 'varchar', length: 50 })
  roleName: string;

  @OneToMany(() => UserRole, (ur) => ur.role)
  userRoles: UserRole[];
}
