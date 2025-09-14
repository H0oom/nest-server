import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'nest_auth',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // 개발 환경에서만 true, 프로덕션에서는 false
  logging: true,
};
