// src/app/services/aux.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  constructor(private api: ApiService) { }

  listarUnits(): Observable<any[]> {
    return this.api.get<any[]>('/Unit', { page: 0, size: 100 });
  }

  listarTags(): Observable<any[]> {
    return this.api.get<any[]>('/Tag', { page: 0, size: 100 });
  }

  listarStatuses(): Observable<any[]> {
    return this.api.get<any[]>('/Status', { page: 0, size: 100 });
  }

  adicionarTag(tag: any): Observable<any> {
    return this.api.post<any>('/Tag', tag);
  }

  deletarTag(nid: any): Observable<any> {
    return this.api.delete<any>(`/Tag/${nid}`);
  }
}