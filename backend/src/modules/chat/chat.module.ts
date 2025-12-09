import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatMessage } from '../../shared/schemas/chat-message.entity';
import { ChatConversation } from '../../shared/schemas/chat-conversation.entity';
import { Users } from '../../shared/schemas/users.entity';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { ChatRepository } from './repositories/chat.repository';
import { ChatGateway } from './gateways/chat.gateway';
import { UserModule } from '../users/user.module';
import { TheatersModule } from '../theaters/theaters.module';
import { jwtConstants } from '../auth/auth.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, ChatConversation, Users]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn as any },
    }),
    forwardRef(() => UserModule),
    forwardRef(() => TheatersModule),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}

