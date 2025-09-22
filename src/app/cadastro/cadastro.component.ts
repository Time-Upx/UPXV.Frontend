import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.css']
})
export class CadastroComponent implements OnInit {
  cadastroForm: FormGroup;
  mensagemErro: string = '';
  mensagemSucesso: string = '';
  formSubmitted: boolean = false; // Nova variável para rastrear submissão

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.cadastroForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required]
    }, { validators: this.senhasIguaisValidator });
  }

  ngOnInit(): void { }

  // Validador personalizado para verificar se as senhas coincidem
  senhasIguaisValidator(form: FormGroup) {
    const senha = form.get('senha')?.value;
    const confirmarSenha = form.get('confirmarSenha')?.value;
    return senha === confirmarSenha ? null : { senhasNaoCoincidem: true };
  }

  cadastrar() {
    this.formSubmitted = true; // Marca o formulário como enviado

    if (this.cadastroForm.invalid) {
      return;
    }

    const usuario = {
      nome: this.cadastroForm.get('nome')?.value,
      email: this.cadastroForm.get('email')?.value,
      senha: this.cadastroForm.get('senha')?.value
    };

    this.authService.cadastrar(usuario).subscribe({
      next: () => {
        this.mensagemSucesso = 'Cadastro realizado com sucesso! Redirecionando para o login...';
        this.mensagemErro = '';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.mensagemErro = err.error?.message || 'Erro ao realizar cadastro. Tente novamente.';
        this.mensagemSucesso = '';
      }
    });
  }
}