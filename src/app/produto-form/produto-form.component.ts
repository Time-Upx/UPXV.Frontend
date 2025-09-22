import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProdutoService } from '../services/produto.service';

@Component({
  selector: 'app-produto-form',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './produto-form.component.html',
  styleUrls: ['./produto-form.component.css']
})
export class ProdutoFormComponent implements OnInit {
  router: Router = inject(Router);

  produtoForm: FormGroup;
  isEdit: boolean = false;
  novaTag: string = '';
  novoStatus: string = '';
  statusList: string[] = []; // Lista de opções disponíveis
  statusAtivo: string = ''; // Status selecionado atualmente
  mensagemErro: string = '';
  mensagemSucesso: string = '';
  formSubmitted: boolean = false;
  carregando: boolean = false;

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private route: ActivatedRoute,
  ) {
    this.produtoForm = this.fb.group({
      nome: ['', Validators.required],
      categoria: ['consumivel', Validators.required],
      tags: [[]],
      descricao: [''],
      quantidade: [0, [Validators.required, Validators.min(0)]],
      status_ativo: [''] // Status selecionado
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.isEdit = true;
        this.carregando = true;
        this.mensagemErro = '';

        this.produtoService.getProdutoById(+id).subscribe({
          next: (produto) => {

            // 1. Preencher campos básicos
            this.produtoForm.patchValue({
              nome: produto.nome || '',
              categoria: produto.categoria || 'consumivel',
              descricao: produto.descricao || '',
              quantidade: produto.quantidade || 0,
              status_ativo: produto.status_ativo || ''
            });

            // 2. CARREGAR TAGS
            let tagsArray: string[] = produto.tags || [];

            this.produtoForm.get('tags')?.setValue(tagsArray);

            // 3. CARREGAR STATUS - COMO ARRAY
            this.statusAtivo = produto.status_ativo || '';

            if (produto.categoria === 'patrimonio') {

              // Carregar lista de opções de status
              if (produto.status_options) {
                try {
                  if (Array.isArray(produto.status_options)) {
                    this.statusList = produto.status_options.filter((opt: any) => typeof opt === 'string' && opt.trim() !== '');
                  } else {
                    // Fallback: usar status_ativo como única opção
                    this.statusList = this.statusAtivo ? [this.statusAtivo] : ['Ativo'];
                  }
                } catch (e) {
                  console.warn('Erro ao parsear status_options:', e);
                  this.statusList = this.statusAtivo ? [this.statusAtivo] : ['Ativo'];
                }
              } else {
                // Sem status_options - criar com base no status_ativo
                this.statusList = this.statusAtivo ? [this.statusAtivo] : ['Ativo'];
              }

              // Garantir que status_ativo está na lista
              if (this.statusAtivo && !this.statusList.includes(this.statusAtivo)) {
                this.statusList.unshift(this.statusAtivo);
              }

              // Aplicar ao FormControl
              this.produtoForm.get('status_ativo')?.setValue(this.statusAtivo);
            } else {
              // Consumível - limpar status
              this.statusList = [];
              this.statusAtivo = '';
              this.produtoForm.get('status_ativo')?.setValue('');
            }

            // 4. Atualizar validadores
            setTimeout(() => {
              this.atualizarValidadores();
              this.carregando = false;
            }, 100);
          },
          error: (err) => {
            console.error('Erro ao carregar produto:', err);
            this.mensagemErro = err.error?.message || 'Produto não encontrado.';
            this.carregando = false;
            this.isEdit = false;
          }
        });
      } else {
        // Modo criação
        this.isEdit = false;
        this.limparFormulario();
        this.atualizarValidadores();
        this.carregando = false;
      }
    });
  }

  limparFormulario() {
    this.produtoForm.reset({
      nome: '',
      categoria: 'consumivel',
      tags: [],
      descricao: '',
      quantidade: 0,
      status_ativo: ''
    });
    this.novaTag = '';
    this.novoStatus = '';
    this.statusList = [];
    this.statusAtivo = '';
    this.mensagemErro = '';
    this.mensagemSucesso = '';
  }

  atualizarValidadores() {
    const categoria = this.produtoForm.get('categoria')?.value;

    if (categoria === 'consumivel') {
      this.produtoForm.get('quantidade')?.setValidators([Validators.required, Validators.min(0)]);
      this.produtoForm.get('status_ativo')?.clearValidators();
    } else if (categoria === 'patrimonio') {
      this.produtoForm.get('status_ativo')?.setValidators(Validators.required);
      this.produtoForm.get('quantidade')?.clearValidators();

      // Garantir que há opções de status
      if (!this.statusList.length) {
        this.statusList = ['Ativo'];
        this.produtoForm.get('status_ativo')?.setValue('Ativo');
      }
    }

    this.produtoForm.get('quantidade')?.updateValueAndValidity();
    this.produtoForm.get('status_ativo')?.updateValueAndValidity();
  }

  onCategoriaChange() {
    const novaCategoria = this.produtoForm.get('categoria')?.value;

    if (novaCategoria === 'consumivel') {
      // Limpar status para consumível
      this.statusList = [];
      this.statusAtivo = '';
      this.produtoForm.get('status_ativo')?.setValue('');
    } else if (novaCategoria === 'patrimonio') {
      // Configurar status padrão para patrimônio
      if (!this.statusList.length) {
        this.statusList = ['Ativo'];
        this.statusAtivo = 'Ativo';
        this.produtoForm.get('status_ativo')?.setValue('Ativo');
      }
    }

    this.atualizarValidadores();
  }

  // Tags permanecem iguais
  adicionarTag() {
    if (this.novaTag && this.novaTag.trim()) {
      const tagsAtuais = this.produtoForm.get('tags')?.value || [];
      const novaTagLimpa = this.novaTag.trim();

      if (!tagsAtuais.includes(novaTagLimpa)) {
        tagsAtuais.push(novaTagLimpa);
        this.produtoForm.get('tags')?.setValue(tagsAtuais);
      }

      this.novaTag = '';
    }
  }

  removerTag(index: number) {
    const tagsAtuais = this.produtoForm.get('tags')?.value || [];
    tagsAtuais.splice(index, 1);
    this.produtoForm.get('tags')?.setValue(tagsAtuais);
  }

  // STATUS - AGORA COM ARRAY
  adicionarStatus() {
    if (this.novoStatus && this.novoStatus.trim()) {
      const novoStatusLimpo = this.novoStatus.trim();

      if (!this.statusList.includes(novoStatusLimpo)) {
        this.statusList.push(novoStatusLimpo);
        // Selecionar o novo status automaticamente
        this.statusAtivo = novoStatusLimpo;
        this.produtoForm.get('status_ativo')?.setValue(novoStatusLimpo);
      } else {
      }

      this.novoStatus = '';
    }
  }

  removerStatus(index: number) {
    const statusRemovido = this.statusList.splice(index, 1)[0];

    // Se era o status ativo, deselecionar ou escolher outro
    if (statusRemovido === this.statusAtivo) {
      if (this.statusList.length > 0) {
        // Selecionar o primeiro disponível
        this.statusAtivo = this.statusList[0];
        this.produtoForm.get('status_ativo')?.setValue(this.statusAtivo);
      } else {
        // Sem opções - limpar
        this.statusAtivo = '';
        this.produtoForm.get('status_ativo')?.setValue('');
      }
    }
  }

  // Quando o usuário seleciona um status diferente via radio button
  onStatusChange(novoStatus: string) {
    this.statusAtivo = novoStatus;
  }

  salvar() {
    this.formSubmitted = true;

    if (this.produtoForm.invalid) {
      return;
    }

    const categoria = this.produtoForm.get('categoria')?.value;
    const produto = {
      nome: this.produtoForm.get('nome')?.value?.trim(),
      categoria: categoria,
      tags: this.produtoForm.get('tags')?.value || [],
      descricao: this.produtoForm.get('descricao')?.value?.trim() || null,
      quantidade: categoria === 'consumivel' ?
        (Number(this.produtoForm.get('quantidade')?.value) || 0) : null,
      // STATUS COMO ARRAY
      status_ativo: categoria === 'patrimonio' ?
        this.produtoForm.get('status_ativo')?.value?.trim() || null : null,
      status_options: categoria === 'patrimonio' ?
        this.statusList.length > 0 ? this.statusList : null : null
    };

    const request = this.isEdit
      ? this.produtoService.atualizarProduto(+this.route.snapshot.paramMap.get('id')!, produto)
      : this.produtoService.criarProduto(produto);

    request.subscribe({
      next: (response) => {
        this.mensagemSucesso = this.isEdit ? 'Produto atualizado!' : 'Produto criado!';
        setTimeout(() => {
          this.router.navigate(['/produtos']);
        }, 2000);
      },
      error: (err) => {
        console.error('Erro:', err);
        this.mensagemErro = err.error?.message || 'Erro ao salvar.';
      }
    });
  }
}