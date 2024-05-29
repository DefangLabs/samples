import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket;

  constructor() {
    console.log('Connecting to WebSocket!!!:', environment.SOCKET_IO_URL);
    this.socket = io(environment.SOCKET_IO_URL);
  }

  sendMessage(message: string) {
    console.log('Emit message:', message);
    this.socket.emit('message', message);
  }

  getMessages(): Observable<string> {
    return new Observable(observer => {
      this.socket.on('message', (message: string) => {
        console.log('Message received:', message);
        observer.next(message);
      });
    });
  }
}
