import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PageService } from './page.service';
import { PageDTO, Status, Tag } from './utils.service';

export interface Patrimony {
  id: number;
  name: string;
  description?: string;
  status?: Status;
  tags?: Tag[];
}

export interface PatrimonyCreateDTO {
  name: string;
  description?: string;
  statusId: number;
  tagIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class PatrimonyService {
  private endpoint = '/patrimonies';

  constructor(
    private api: ApiService,
    private pageService: PageService
  ) { }

  listar(pageIndex: number = 0, pageSize: number = 10): Observable<PageDTO<Patrimony>> {
    return this.pageService.listar<Patrimony>(this.endpoint, pageIndex, pageSize);
  }

  criar(patrimony: PatrimonyCreateDTO): Observable<Patrimony> {
    return this.api.post<Patrimony>(this.endpoint, patrimony);
  }

  atualizar(id: number, patrimony: Partial<PatrimonyCreateDTO>): Observable<Patrimony> {
    return this.api.put<Patrimony>(`${this.endpoint}/${id}`, patrimony);
  }

  getById(id: number): Observable<Patrimony> {
    return this.api.get<Patrimony>(`${this.endpoint}/${id}`);
  }

  deletar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}