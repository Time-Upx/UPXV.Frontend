import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PageService } from './page.service';

// === PAGE DTO GENÉRICO ===
export interface PageDTO<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// === ENTIDADES AUXILIARES (ÚNICAS NO PROJETO) ===
export interface Unit {
  id: number;
  name: string;
  abbreviation: string;
  description?: string;
  hover?: boolean;
}

export interface Tag {
  id: number;
  name: string;
  description?: string;
  hover?: boolean;
}

export interface Status {
  id: number;
  name: string;
  description?: string;
  hover?: boolean;
}

export interface Item {
  id: number;
  type: 'consumable' | 'patrimony';
  consumable?: {
    id: number;
    name: string;
    quantity: number;
    unit: { name: string; abbreviation: string };
    tags?: Tag[];
  };
  patrimony?: {
    id: number;
    name: string;
    description?: string;
    status: Status;
    tags?: Tag[];
  };
}

// === DTOS DE CRIAÇÃO/ATUALIZAÇÃO (sem ID) ===
export type UnitCreateDTO = Omit<Unit, 'id'>;
export type TagCreateDTO = Omit<Tag, 'id'>;
export type StatusCreateDTO = Omit<Status, 'id'>;

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  constructor(
    private api: ApiService,
    private pageService: PageService
  ) { }

  // === ITEMS ===
  listarItems(pageIndex: number = 0, pageSize: number = 10): Observable<PageDTO<Item>> {
    return this.pageService.listar<Item>('/items', pageIndex, pageSize);
  }

  // === UNITS ===
  listarUnits(pageIndex: number = 0, pageSize: number = 10): Observable<PageDTO<Unit>> {
    return this.pageService.listar<Unit>('/units', pageIndex, pageSize);
  }

  adicionarUnit(unit: UnitCreateDTO): Observable<Unit> {
    return this.api.post<Unit>('/units', unit);
  }

  atualizarUnit(id: number, unit: Partial<Unit>): Observable<Unit> {
    return this.api.put<Unit>(`/units/${id}`, unit);
  }

  deletarUnit(id: number): Observable<void> {
    return this.api.delete<void>(`/units/${id}`);
  }

  checkUnitUsage(id: number): Observable<PageDTO<any>> {
    return this.pageService.checkUsage('/units', id);
  }

  // === TAGS ===
  listarTags(pageIndex: number = 0, pageSize: number = 100): Observable<PageDTO<Tag>> {
    return this.pageService.listar<Tag>('/tags', pageIndex, pageSize);
  }

  adicionarTag(tag: TagCreateDTO): Observable<Tag> {
    return this.api.post<Tag>('/tags', tag);
  }

  atualizarTag(id: number, tag: Partial<Tag>): Observable<Tag> {
    return this.api.put<Tag>(`/tags/${id}`, tag);
  }

  deletarTag(id: number): Observable<void> {
    return this.api.delete<void>(`/tags/${id}`);
  }

  checkTagUsageInConsumables(id: number): Observable<PageDTO<any>> {
    return this.pageService.listar<any>(`/tags/${id}/usage/consumables`, 0, 1);
  }

  checkTagUsageInPatrimonies(id: number): Observable<PageDTO<any>> {
    return this.pageService.listar<any>(`/tags/${id}/usage/patrimonies`, 0, 1);
  }

  // === STATUS ===
  listarStatuses(pageIndex: number = 0, pageSize: number = 100): Observable<PageDTO<Status>> {
    return this.pageService.listar<Status>('/status', pageIndex, pageSize);
  }

  adicionarStatus(status: StatusCreateDTO): Observable<Status> {
    return this.api.post<Status>('/status', status);
  }

  atualizarStatus(id: number, status: Partial<Status>): Observable<Status> {
    return this.api.put<Status>(`/status/${id}`, status);
  }

  deletarStatus(id: number): Observable<void> {
    return this.api.delete<void>(`/status/${id}`);
  }

  checkStatusUsage(id: number): Observable<PageDTO<any>> {
    return this.pageService.checkUsage('/status', id);
  }
}