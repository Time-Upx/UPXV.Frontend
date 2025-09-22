import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) { }

  cadastrar(usuario: { nome: string; email: string; senha: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/cadastro`, usuario);
  }

  login(credenciais: { login: string; senha: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciais);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getUsuarioId(): number | null {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: { id: number } = jwtDecode(token);
      return decoded.id;
    }
    return null;
  }
}