import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PageService } from './page.service';
import { PageDTO, Unit, Tag } from './utils.service';

export interface Consumable {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: Unit;
  tags?: Tag[];
}

export interface ConsumableCreateDTO {
  name: string;
  description?: string;
  quantity: number;
  unitId: number;
  tagIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ConsumableService {
  private endpoint = '/consumables';

  constructor(
    private api: ApiService,
    private pageService: PageService
  ) { }

  listar(pageIndex: number = 0, pageSize: number = 10): Observable<PageDTO<Consumable>> {
    return this.pageService.listar<Consumable>(this.endpoint, pageIndex, pageSize);
  }

  criar(consumable: ConsumableCreateDTO): Observable<Consumable> {
    return this.api.post<Consumable>(this.endpoint, consumable);
  }

  atualizar(id: number, consumable: Partial<ConsumableCreateDTO>): Observable<Consumable> {
    return this.api.put<Consumable>(`${this.endpoint}/${id}`, consumable);
  }

  getById(id: number): Observable<Consumable> {
    return this.api.get<Consumable>(`${this.endpoint}/${id}`);
  }

  deletar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}