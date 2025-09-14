import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule, 
    UserModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
