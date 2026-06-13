import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('booking/:bookingId')
  async getChatByBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: User,
  ) {
    return this.chatService.getChatByBooking(bookingId, user.id);
  }

  @Get(':chatId/messages')
  async getMessages(
    @Param('chatId') chatId: string,
    @CurrentUser() user: User,
  ) {
    const messages = await this.chatService.getMessages(chatId, user.id);
    return messages.reverse();
  }

  @Post(':chatId/messages')
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body('content') content: string,
    @CurrentUser() user: User,
  ) {
    return this.chatService.sendMessage(chatId, user.id, content);
  }

  @Post('booking/:bookingId')
  async initChat(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: User,
  ) {
    return this.chatService.getOrCreateChat(bookingId, user.id);
  }
}
