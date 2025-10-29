import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PageDTO } from './utils.service';
import { QRCodeExportDTO } from './qrcode.service';

@Injectable({
  providedIn: 'root'
})
export class PageService {
  constructor(private api: ApiService) { }

  /**
   * Lista paginada genérica
   */
  listar<T>(endpoint: string, pageIndex: number = 0, pageSize: number = 10): Observable<PageDTO<T>> {
    return this.api.get<PageDTO<T>>(endpoint, { pageIndex, pageSize });
  }

  /**
   * Lista com parâmetros extras (busca, filtro, ordenação)
   */
  listarComParams<T>(
    endpoint: string,
    pageIndex: number = 0,
    pageSize: number = 10,
    params: Record<string, any> = {}
  ): Observable<PageDTO<T>> {
    const queryParams = { pageIndex, pageSize, ...params };
    return this.api.get<PageDTO<T>>(endpoint, queryParams);
  }

  /**
   * Verifica uso (apenas 1 item para checar se existe)
   */
  checkUsage(endpoint: string, id: number): Observable<PageDTO<any>> {
    return this.api.get<PageDTO<any>>(`${endpoint}/${id}/usage`, { pageIndex: 0, pageSize: 1 });
  }

  exportQRImage(endpoint: string, id: number, config: QRCodeExportDTO): Observable<Blob> {
    return this.api.postBlob(`${endpoint}/${id}/export`, config);
  }
}