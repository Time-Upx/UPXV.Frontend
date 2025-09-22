import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credenciais = {
    login: '',
    senha: ''
  };
  mensagemErro: string = '';
  mensagemSucesso: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    this.authService.login(this.credenciais).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        this.mensagemSucesso = 'Login bem-sucedido! Redirecionando...';
        this.mensagemErro = '';
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (err) => {
        this.mensagemErro = err.error?.message || 'Erro ao fazer login. Verifique suas credenciais.';
        this.mensagemSucesso = '';
      }
    });
  }
}