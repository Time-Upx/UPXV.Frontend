import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class PatrimonyService {
  private endpoint = '/Patrimony';

  constructor(private api: ApiService) { }

  listar(page: number = 0, size: number = 10): Observable<any[]> {
    return this.api.get<any[]>(this.endpoint, { page, size });
  }

  criar(patrimony: any): Observable<any> {
    return this.api.post<any>(this.endpoint, patrimony);
  }

  atualizar(patrimony: any): Observable<any> {
    return this.api.put<any>(this.endpoint, patrimony);  // PUT para /Patrimony com DTO incluindo nid
  }

  getById(nid: number): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/${nid}`);
  }

  deletar(nid: number): Observable<any> {
    return this.api.delete<any>(`${this.endpoint}/${nid}`);
  }
}