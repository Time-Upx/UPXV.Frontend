import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PageService } from './page.service';
import { PageDTO } from './utils.service';

export interface QRCodeCreateDTO {
  intentId: number;
  name?: string;
  description?: string;
  expiration?: string; // datetime
  password?: string;
  usageLimit?: number;
  intentArguments?: Record<string, string>;
}

export interface QRCodeUpdateDTO {
  intentId?: number;
  name?: string;
  description?: string;
  password?: string;
  usageLimit?: number;
  intentArguments?: Record<string, string>;
}

export interface QRCodeExportDTO {
  width?: number;
  height?: number;
  margin?: number;
  quality?: number;
}

export interface QRCode {
  id: number;
  url: string;
  intent: { id: number; name: string; type: 1 | 2; description?: string; parameters?: string[] };
  name?: string;
  description?: string;
  expiration?: string;
  password?: string;
  usageLimit?: number;
  timesUsed: number;
  arguments?: Record<string, string>;
  hasExpired: boolean;
  hasReachedUsageLimit: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class QRCodeService {
  private endpoint = '/qrcodes';

  constructor(
    private api: ApiService,
    private pageService: PageService
  ) { }

  listar(pageIndex: number = 0, pageSize: number = 10): Observable<PageDTO<QRCode>> {
    return this.pageService.listar<QRCode>(this.endpoint, pageIndex, pageSize);
  }

  criar(qr: QRCodeCreateDTO): Observable<QRCode> {
    return this.api.post<QRCode>(this.endpoint, qr);
  }

  atualizar(id: number, qr: QRCodeUpdateDTO): Observable<QRCode> {
    return this.api.put<QRCode>(`${this.endpoint}/${id}`, qr);
  }

  getById(id: number): Observable<QRCode> {
    return this.api.get<QRCode>(`${this.endpoint}/${id}`);
  }

  deletar(id: number): Observable<QRCode> {
    return this.api.delete<QRCode>(`${this.endpoint}/${id}`);
  }

  exportImage(id: number, config: QRCodeExportDTO = {}): Observable<Blob> {
    return this.pageService.exportQRImage(this.endpoint, id, config);
  }
}