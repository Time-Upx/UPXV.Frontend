import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UtilsService, PageDTO, Tag } from '../../services/utils.service';
import { ModalService, ModalActionItem } from '../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tag-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tag-list.component.html',
  styleUrls: ['./tag-list.component.css']
})
export class TagListComponent implements OnInit, OnDestroy {
  tags: Tag[] = [];
  filteredTags: Tag[] = [];
  searchTerm = '';
  mensagemErro = '';
  mensagemSucesso = '';
  formGroup: FormGroup;
  editModeId: number | null = null;
  carregandoForm = false;
  formSubmitted = false;
  loading = false;

  // Paginação
  currentPage = 0;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  pageNumbers: number[] = [];

  private subscription = new Subscription();

  constructor(
    private utilsService: UtilsService,
    private modalService: ModalService,
    private fb: FormBuilder
  ) {
    this.formGroup = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadTags();

    // Escuta confirmação de exclusão
    this.subscription.add(
      this.modalService.onConfirm().subscribe((item: ModalActionItem) => {
        if (item.type === 'tag') {
          this.deletar(item.nid);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadTags() {
    this.loading = true;
    this.mensagemErro = '';

    this.utilsService.listarTags(this.currentPage, this.pageSize).subscribe({
      next: (page: PageDTO<Tag>) => {
        this.tags = page.items;
        this.filteredTags = [...this.tags];
        this.totalCount = page.totalCount;
        this.totalPages = page.totalPages;
        this.updatePageNumbers();
        this.loading = false;
      },
      error: () => {
        this.mensagemErro = 'Erro ao carregar tags.';
        this.loading = false;
      }
    });
  }

  onSearch() {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredTags = this.tags.filter(tag =>
      tag.name.toLowerCase().includes(term) ||
      tag.description?.toLowerCase().includes(term) ||
      false
    );
  }

  updatePageNumbers() {
    const maxVisible = 5;
    const pages: number[] = [];

    if (this.totalPages <= maxVisible) {
      for (let i = 0; i < this.totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(0, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisible);

      if (start > 0) pages.push(0);
      if (start > 1) pages.push(-1);
      for (let i = start; i < end; i++) pages.push(i);
      if (end < this.totalPages - 1) pages.push(-1);
      if (end < this.totalPages) pages.push(this.totalPages - 1);
    }
    this.pageNumbers = pages;
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadTags();
    }
  }

  toggleEdit(id: number | null) {
    this.editModeId = id;
    this.formSubmitted = false;
    if (id) {
      const tag = this.tags.find(t => t.id === id);
      if (tag) {
        this.formGroup.patchValue({
          name: tag.name,
          description: tag.description
        });
      }
    } else {
      this.formGroup.reset();
    }
  }

  salvar(id: number | null) {
    this.formSubmitted = true;
    if (this.formGroup.valid) {
      this.carregandoForm = true;
      const payload = this.formGroup.value;

      const obs$ = id
        ? this.utilsService.atualizarTag(id, payload)
        : this.utilsService.adicionarTag(payload);

      obs$.subscribe({
        next: () => {
          this.mensagemSucesso = id ? 'Tag atualizada!' : 'Tag adicionada!';
          this.loadTags();
          this.toggleEdit(null);
          setTimeout(() => this.mensagemSucesso = '', 3000);
        },
        error: (err) => {
          this.mensagemErro = err.error?.message || (id ? 'Erro ao atualizar.' : 'Erro ao adicionar.');
          setTimeout(() => this.mensagemErro = '', 5000);
        },
        complete: () => this.carregandoForm = false
      });
    }
  }

  confirmarDeletar(id: number, name: string) {
    this.checkIfUsed(id, () => {
      this.modalService.showConfirmation(
        'Excluir Tag',
        `Tem certeza que deseja excluir a tag "<strong>${name}</strong>"?`,
        { nid: id, name: `T${id}`, type: 'tag' }
      );
    });
  }

  private checkIfUsed(id: number, onNotUsed: () => void) {
    // Verifica uso em consumíveis
    this.utilsService.checkTagUsageInConsumables(id).subscribe({
      next: (data: PageDTO<any>) => {
        if (data.totalCount > 0) {
          this.mensagemErro = 'Tag em uso por consumíveis. Não pode ser deletada.';
          setTimeout(() => this.mensagemErro = '', 4000);
          return;
        }

        // Verifica uso em patrimônios
        this.utilsService.checkTagUsageInPatrimonies(id).subscribe({
          next: (data: PageDTO<any>) => {
            if (data.totalCount > 0) {
              this.mensagemErro = 'Tag em uso por patrimônios. Não pode ser deletada.';
              setTimeout(() => this.mensagemErro = '', 4000);
              return;
            }
            onNotUsed();
          },
          error: () => {
            this.mensagemErro = 'Erro ao verificar uso da tag.';
            setTimeout(() => this.mensagemErro = '', 4000);
          }
        });
      },
      error: () => {
        this.mensagemErro = 'Erro ao verificar uso da tag.';
        setTimeout(() => this.mensagemErro = '', 4000);
      }
    });
  }

  deletar(id: number) {
    this.utilsService.deletarTag(id).subscribe({
      next: () => {
        this.mensagemSucesso = 'Tag excluída com sucesso!';
        this.loadTags();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => {
        this.mensagemErro = err.error?.message || 'Erro ao excluir tag.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}