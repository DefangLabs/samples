import { Component, OnInit } from '@angular/core';
import { io } from 'socket.io-client';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss']
})
export class ChatRoomComponent implements OnInit {
  messages: string[] = [];
  message: string = '';
  socket: any;

  ngOnInit() {
    this.socket = io('http://localhost:3000');
    this.socket.on('message', (data: string) => {
      this.messages.push(data);
    });
  }

  sendMessage(event: Event): void {
    event.preventDefault();
    if (this.message) {
      this.socket.emit('message', this.message);
      this.message = '';
    }
  }
}
