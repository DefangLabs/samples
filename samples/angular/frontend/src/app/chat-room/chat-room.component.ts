import { Component, OnInit } from '@angular/core';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss']
})
export class ChatRoomComponent implements OnInit {
  messages: string[] = [];
  message: string = '';

  constructor(private chatService: ChatService) {
    console.log('ChatRoomComponent constructor called');
  }

  ngOnInit() {
    console.log('ChatRoomComponent ngOnInit called');
    this.chatService.receiveMessages().subscribe((data: string) => {
      this.messages.push(data);
    });
  }

  sendMessage(event: Event): void {
    event.preventDefault();
    if (this.message) {
      this.chatService.sendMessage(this.message);
      this.message = '';
    }
  }
}
