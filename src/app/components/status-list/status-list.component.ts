import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UtilsService, PageDTO } from '../../services/utils.service';
import { ModalService, ModalActionItem } from '../../services/modal.service';
import { Subscription } from 'rxjs';

interface Status {
  id: number;
  name: string;
  description?: string;
}

@Component({
  selector: 'app-status-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './status-list.component.html',
  styleUrls: ['./status-list.component.css']
})
export class StatusListComponent implements OnInit, OnDestroy {
  statuses: Status[] = [];
  filteredStatuses: Status[] = [];
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
    this.loadStatuses();

    this.subscription.add(
      this.modalService.onConfirm().subscribe((item: ModalActionItem) => {
        if (item.type === 'status') {
          this.deletar(item.nid);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadStatuses() {
    this.loading = true;
    this.mensagemErro = '';

    this.utilsService.listarStatuses(this.currentPage, this.pageSize).subscribe({
      next: (page: PageDTO<Status>) => {
        this.statuses = page.items;
        this.filteredStatuses = [...this.statuses];
        this.totalCount = page.totalCount;
        this.totalPages = page.totalPages;
        this.updatePageNumbers();
        this.loading = false;
      },
      error: () => {
        this.mensagemErro = 'Erro ao carregar status.';
        this.loading = false;
      }
    });
  }

  onSearch() {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredStatuses = this.statuses.filter(s =>
      s.name.toLowerCase().includes(term) ||
      (s.description && s.description.toLowerCase().includes(term))
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
      this.loadStatuses();
    }
  }

  toggleEdit(id: number | null) {
    this.editModeId = id;
    this.formSubmitted = false;
    if (id) {
      const status = this.statuses.find(s => s.id === id);
      if (status) {
        this.formGroup.patchValue({
          name: status.name,
          description: status.description
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
        ? this.utilsService.atualizarStatus(id, payload)
        : this.utilsService.adicionarStatus(payload);

      obs$.subscribe({
        next: () => {
          this.mensagemSucesso = id ? 'Status atualizado!' : 'Status adicionado!';
          this.loadStatuses();
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
    this.utilsService.checkStatusUsage(id).subscribe({
      next: (data: PageDTO<any>) => {
        if (data.totalCount > 0) {
          this.mensagemErro = 'Status em uso por patrimônios. Não pode ser deletado.';
          setTimeout(() => this.mensagemErro = '', 4000);
          return;
        }

        this.modalService.showConfirmation(
          'Excluir Status',
          `Tem certeza que deseja excluir o status "<strong>${name}</strong>"?`,
          { nid: id, name: `S${id}`, type: 'status' }
        );
      },
      error: () => {
        this.mensagemErro = 'Erro ao verificar uso do status.';
        setTimeout(() => this.mensagemErro = '', 4000);
      }
    });
  }

  deletar(id: number) {
    this.utilsService.deletarStatus(id).subscribe({
      next: () => {
        this.mensagemSucesso = 'Status excluído com sucesso!';
        this.loadStatuses();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => {
        this.mensagemErro = err.error?.message || 'Erro ao excluir status.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}