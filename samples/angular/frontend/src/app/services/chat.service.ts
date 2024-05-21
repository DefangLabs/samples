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
    console.log('ChatService constructor called');
    this.socket = io(environment.SOCKET_IO_URL);
  }

  sendMessage(message: string) {
    this.socket.emit('message', message);
  }

  receiveMessages(): Observable<string> {
    return new Observable(observer => {
      this.socket.on('message', (data: string) => {
        observer.next(data);
      });
    });
  }
}
