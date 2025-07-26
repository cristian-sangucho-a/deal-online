import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  // --- INICIO DE LA CORRECCIÓN ---
  // Especificamos explícitamente el tipo de columna para la base de datos.
  // Sigue siendo 'string | null' para TypeScript, pero TypeORM ahora sabe
  // que en PostgreSQL debe ser un 'varchar'.
  @Column({ type: 'varchar', length: 20, nullable: true })
  celular: string | null;
  // --- FIN DE LA CORRECCIÓN ---

  @Column({ length: 100, unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ length: 20, default: 'client' })
  role: string;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ type: 'varchar', length: 6, nullable: true })
  verification_code: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verification_code_expires: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password_hash) {
      this.password_hash = await bcrypt.hash(this.password_hash, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }
}
