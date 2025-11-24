import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserRole } from './user-role.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    name: 'role_name', 
    type: 'enum', 
    enum: ['ROLE_ADMIN', 'ROLE_USER'] 
  })
  roleName: 'ROLE_ADMIN' | 'ROLE_USER';

  @OneToMany(() => UserRole, (ur) => ur.role)
  userRoles: UserRole[];
}
