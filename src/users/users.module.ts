import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEntity } from './entities/user.entity';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
   imports: [
    TypeOrmModule.forFeature([UserEntity]),
    SupabaseModule, // 🔑 Add this
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
