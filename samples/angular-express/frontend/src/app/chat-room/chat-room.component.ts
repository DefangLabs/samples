import { Component, OnInit } from '@angular/core';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss']
})
export class ChatRoomComponent implements OnInit {
  message: string = '';
  messages: string[] = [];

  constructor(private chatService: ChatService) {
    console.log('ChatRoomComponent constructor');
  }

  ngOnInit(): void {
    console.log('ChatRoomComponent initialized');
    this.chatService.getMessages().subscribe((message: string) => {
      console.log('New message received:', message);
      this.messages.push(message);
    });
  }

  sendMessage(): void {
    if (this.message.trim()) {
      console.log('Sending message:', this.message);
      this.chatService.sendMessage(this.message);
      this.message = '';
    }
  }
}
