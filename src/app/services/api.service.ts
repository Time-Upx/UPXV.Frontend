import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://192.168.229.164/UPXV.Backend/api';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  get<T>(endpoint: string, params?: any): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
      params
    });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, { headers: this.getHeaders() });
  }

  // === POST BLOB (para exportação de imagem) ===
  postBlob(endpoint: string, body: any = {}): Observable<Blob> {
    const finalOptions = {
      responseType: 'blob' as 'json', // Força tipo sem quebrar tipagem
      headers: this.getHeaders()
    };
    return this.http.post(`${this.baseUrl}${endpoint}`, body, finalOptions) as Observable<Blob>;
  }

  put<T>(endpoint: string, body: any): Observable<T> {  // Novo: para updates
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, { headers: this.getHeaders() });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, { headers: this.getHeaders() });
  }
}