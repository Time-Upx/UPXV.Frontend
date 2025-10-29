import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Intent {
  id: number;
  type: 1 | 2; // 1: Redirecionamento, 2: Ação
  name: string;
  description?: string;
  parameters?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class IntentService {
  constructor(private api: ApiService) { }

  listar(): Observable<Intent[]> {
    return this.api.get<Intent[]>('/intents');
  }

  getById(id: number): Observable<Intent> {
    return this.api.get<Intent>(`/intents/${id}`);
  }
}