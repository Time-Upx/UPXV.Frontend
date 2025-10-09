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

  atualizarTag(tag: any): Observable<any> {
    return this.api.put<any>('/Tag', tag);
  }

  deletarTag(nid: any): Observable<any> {
    return this.api.delete<any>(`/Tag/${nid}`);
  }

  checkTagUsageInConsumables(tagNid: number): Observable<any> {
    return this.api.get<any>('/Consumable', { page: 0, size: 1, tagNids: tagNid });
  }

  checkTagUsageInPatrimonies(tagNid: number): Observable<any> {
    return this.api.get<any>('/Patrimony', { page: 0, size: 1, tagNids: tagNid });
  }

  adicionarStatus(status: any): Observable<any> {
    return this.api.post<any>('/Status', status);
  }

  atualizarStatus(status: any): Observable<any> {
    return this.api.put<any>('/Status', status);
  }

  deletarStatus(nid: number): Observable<any> {
    return this.api.delete<any>(`/Status/${nid}`);
  }

  adicionarUnit(unit: any): Observable<any> {
    return this.api.post<any>('/Unit', unit);
  }

  atualizarUnit(unit: any): Observable<any> {
    return this.api.put<any>('/Unit', unit);
  }

  deletarUnit(nid: number): Observable<any> {
    return this.api.delete<any>('/Unit/${nid}');
  }

  checkStatusUsage(nid: number): Observable<any> {
    return this.api.get<any>('/Patrimony', { page: 0, size: 1, statusNid: nid });
  }

  checkUnitUsage(nid: number): Observable<any> {
    return this.api.get<any>('/Consumable', { page: 0, size: 1, unitNid: nid });
  }
}