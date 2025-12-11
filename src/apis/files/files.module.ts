import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { Files } from 'src/common/entities/file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Files]),
    // Configure Multer to handle file uploads in memory
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}