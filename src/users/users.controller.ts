import {
  Controller,
  Get,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch('update-profile')
  @ApiOperation({
    summary: 'Update user profile with profile photo (binary) and multiple addresses',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profile_photo', { storage: multer.memoryStorage() }))
  updateProfile(
    @UploadedFile() profile_photo: Express.Multer.File,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(profile_photo, dto);
  }
}
