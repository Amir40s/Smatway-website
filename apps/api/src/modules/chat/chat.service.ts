import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) { }

  private withSenderRole<T extends { sender: { id: string }; senderId: string }>(message: T, chat: { travelerId: string; transporterId: string }) {
    return {
      ...message,
      sender: {
        ...message.sender,
        role: message.senderId === chat.travelerId ? 'traveler' : 'transporter',
      },
    };
  }

  async getOrCreateChat(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { transport: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const isParticipant = booking.travelerId === userId || booking.transport.transporterId === userId;
    if (!isParticipant) throw new ForbiddenException('Not part of this booking');

    let chat = await this.prisma.chat.findUnique({
      where: { bookingId },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          bookingId,
          travelerId: booking.travelerId,
          transporterId: booking.transport.transporterId,
        },
      });
    }

    return chat;
  }

  async getMessages(chatId: string, userId: string, limit: number = 50) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) throw new NotFoundException('Chat not found');

    const isParticipant = chat.travelerId === userId || chat.transporterId === userId;
    if (!isParticipant) throw new ForbiddenException('Not part of this chat');

    const messages = await this.prisma.message.findMany({
      where: { chatId },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.map((message) => this.withSenderRole(message as any, chat));
  }

  async sendMessage(chatId: string, userId: string, content: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) throw new NotFoundException('Chat not found');

    const isParticipant = chat.travelerId === userId || chat.transporterId === userId;
    if (!isParticipant) throw new ForbiddenException('Not part of this chat');

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content: content.trim(),
      },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    return this.withSenderRole(message as any, chat);
  }

  async getChatByBooking(bookingId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { bookingId },
      include: {
        traveler: { select: { id: true, name: true, phoneNumber: true } },
        transporter: { select: { id: true, name: true, phoneNumber: true } },
      },
    });

    if (!chat) return null;

    const isParticipant = chat.travelerId === userId || chat.transporterId === userId;
    if (!isParticipant) throw new ForbiddenException('Not part of this chat');

    return chat;
  }

  async getChatById(chatId: string) {
    return this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        traveler: { select: { id: true, name: true } },
        transporter: { select: { id: true, name: true } },
      },
    });
  }
}
