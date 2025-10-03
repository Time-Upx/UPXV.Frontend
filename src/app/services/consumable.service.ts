import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ConsumableService {
  private endpoint = '/Consumable';

  constructor(private api: ApiService) { }

  listar(page: number = 0, size: number = 10): Observable<any[]> {
    return this.api.get<any[]>(this.endpoint, { page, size });
  }

  criar(consumable: any): Observable<any> {
    return this.api.post<any>(this.endpoint, consumable);
  }

  atualizar(consumable: any): Observable<any> {
    return this.api.put<any>(this.endpoint, consumable);  // PUT para /Consumable com DTO incluindo nid
  }

  getById(nid: number): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/${nid}`);
  }

  deletar(nid: number): Observable<any> {
    return this.api.delete<any>(`${this.endpoint}/${nid}`);
  }
}