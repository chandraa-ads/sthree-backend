import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEntity } from './entities/user.entity';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    SupabaseModule, // ✅ Supabase client for user sync or auth
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [
    UsersService,
    TypeOrmModule, // ✅ Export so relations (like Product.created_by_user) work across modules
  ],
})
export class UsersModule {}
