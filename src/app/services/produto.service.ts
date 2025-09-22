import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private apiUrl = 'http://localhost:3000/api/produtos';

  constructor(private http: HttpClient) { }

  filtrarProdutos(filtros?: { nome?: string; tag?: string; categoria?: string }): Observable<any[]> {
    let url = this.apiUrl;
    if (filtros) {
      const params = new URLSearchParams();
      if (filtros.nome) params.append('nome', filtros.nome);
      if (filtros.tag) params.append('tag', filtros.tag);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      url += `?${params.toString()}`;
    }
    return this.http.get<any[]>(url); // Interceptor cuida do token
  }

  criarProduto(produto: any): Observable<any> {
    return this.http.post(this.apiUrl, produto); // Interceptor cuida do token
  }

  getProdutoById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`); // Interceptor cuida do token
  }

  atualizarProduto(id: number, produto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, produto); // Interceptor cuida do token
  }

  deletarProduto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`); // Interceptor cuida do token
  }
}