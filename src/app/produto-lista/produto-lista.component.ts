import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProdutoService } from '../services/produto.service';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-produto-lista',
  standalone: true,
  imports: [FormsModule, RouterLink, TitleCasePipe],
  templateUrl: './produto-lista.component.html',
  styleUrls: ['./produto-lista.component.css']
})
export class ProdutoListaComponent implements OnInit {
  produtos: any[] = [];
  filtroNome: string = '';
  filtroTag: string = '';
  filtroCategoria: string = '';
  mensagemErro: string = '';
  mensagemSucesso: string = '';
  deletandoId: number | null = null; // Para exclusão individual
  deletandoLote: boolean = false; // Para exclusão em lote

  // Seleção em lote - CORRIGIDO
  selecionados: { [key: number]: boolean } = {};
  selecionarTodos: boolean = false;

  constructor(private produtoService: ProdutoService) { }

  ngOnInit(): void {
    this.filtrar(); // Carrega todos os produtos inicialmente
  }

  filtrar() {
    this.produtoService.filtrarProdutos({
      nome: this.filtroNome,
      tag: this.filtroTag,
      categoria: this.filtroCategoria
    }).subscribe({
      next: (data) => {
        // CORREÇÃO: Inicializar seleção para todos os produtos
        const novosProdutos = data.map(produto => {
          let tagsDisplay = '';
          if (produto.tags) {
            try {
              //const tagsArray = JSON.parse(produto.tags);
              const tagsArray = produto.tags;
              if (Array.isArray(tagsArray)) {
                tagsDisplay = tagsArray.join(', ');
              } else {
                console.warn(`Tags inválidas (não é array) para produto ID ${produto.id}:`, produto.tags);
                tagsDisplay = '';
              }
            } catch (e) {
              console.error(`Erro ao parsear tags para produto ID ${produto.id}:`, e, 'Tags:', produto.tags);
              tagsDisplay = '';
            }
          }
          const produtoCompleto = { ...produto, tagsDisplay };

          // Inicializar seleção para este produto se não existir
          if (!(produto.id in this.selecionados)) {
            this.selecionados[produto.id] = false;
          }

          return produtoCompleto;
        });

        this.produtos = novosProdutos;
        this.atualizarSelecaoTodos(); // Atualizar estado do "Selecionar Todos"
        this.mensagemErro = '';
        this.mensagemSucesso = '';
      },
      error: (err) => {
        this.mensagemErro = err.error?.message || 'Erro ao carregar produtos.';
        this.produtos = [];
        this.mensagemSucesso = '';
        console.error('Erro ao filtrar produtos:', err);
      }
    });
  }

  // Seleção individual - CORRIGIDO
  toggleSelecao(id: number) {
    this.selecionados[id] = !this.selecionados[id];
    this.atualizarSelecaoTodos();
  }

  // Seleção em massa - CORRIGIDO
  toggleSelecaoTodos() {
    const novoEstado = !this.selecionarTodos;

    // Aplicar o novo estado a todos os produtos atuais
    this.produtos.forEach(produto => {
      this.selecionados[produto.id] = novoEstado;
    });

    this.selecionarTodos = novoEstado;
  }

  atualizarSelecaoTodos() {
    if (this.produtos.length === 0) {
      this.selecionarTodos = false;
      return;
    }

    // Verificar se TODOS os produtos estão selecionados
    const todosSelecionados = this.produtos.every(produto => this.selecionados[produto.id]);

    // Verificar se ALGUM produto está selecionado (para estado indeterminado)
    const algumSelecionado = this.produtos.some(produto => this.selecionados[produto.id]);

    if (todosSelecionados) {
      this.selecionarTodos = true;
    } else if (algumSelecionado) {
      this.selecionarTodos = false; // Estado indeterminado (checkbox desmarcado)
    } else {
      this.selecionarTodos = false;
    }
  }

  getItensSelecionados(): number {
    return this.produtos.filter(produto => this.selecionados[produto.id]).length;
  }

  getProdutosSelecionados(): any[] {
    return this.produtos.filter(produto => this.selecionados[produto.id]);
  }

  limparSelecao() {
    // Manter apenas as chaves dos produtos atuais
    this.produtos.forEach(produto => {
      this.selecionados[produto.id] = false;
    });
    this.selecionarTodos = false;
  }

  // Exclusão individual
  deletarProduto(id: number, nome: string) {
    if (confirm(`Tem certeza que deseja excluir o produto "${nome}"? Esta ação não pode ser desfeita.`)) {
      this.deletandoId = id;
      this.mensagemErro = '';
      this.mensagemSucesso = '';

      this.produtoService.deletarProduto(id).subscribe({
        next: (response) => {
          this.mensagemSucesso = 'Produto excluído com sucesso!';
          this.deletandoId = null;
          this.limparSelecao(); // Limpa seleção se estava selecionado
          this.filtrar(); // Recarrega lista
        },
        error: (err) => {
          console.error('Erro ao deletar produto:', err);
          this.mensagemErro = err.error?.message || 'Erro ao excluir produto. Tente novamente.';
          this.deletandoId = null;
        }
      });
    }
  }

  // Exclusão em lote
  confirmarDeletarLote() {
    const selecionados = this.getItensSelecionados();
    if (selecionados === 0) {
      this.mensagemErro = 'Nenhum produto selecionado.';
      return;
    }

    const produtosNomes = this.getProdutosSelecionados().map(p => p.nome).join(', ');
    if (confirm(`Tem certeza que deseja excluir ${selecionados} produto(s)?\n\nProdutos: ${produtosNomes}\n\nEsta ação não pode ser desfeita.`)) {
      this.deletarLote();
    }
  }

  deletarLote() {
    const ids = this.getProdutosSelecionados().map(produto => produto.id);

    if (ids.length === 0) {
      return;
    }

    this.deletandoLote = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    // Deletar em paralelo
    const requests = ids.map(id => this.produtoService.deletarProduto(id));

    Promise.all(requests.map(req => req.toPromise()))
      .then(() => {
        this.mensagemSucesso = `${ids.length} produto(s) excluído(s) com sucesso!`;
        this.deletandoLote = false;
        this.limparSelecao();
        this.filtrar(); // Recarrega lista
      })
      .catch((err) => {
        console.error('Erro ao deletar lote:', err);
        this.mensagemErro = 'Erro ao excluir alguns produtos. Tente novamente.';
        this.deletandoLote = false;
      });
  }
}